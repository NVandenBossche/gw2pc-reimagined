/**
 * Compare our OTC prices with the highlighted cells on gw2pc.com.
 * gw2pc.com is only read to verify our numbers; the site never takes prices from it.
 * Exits non-zero if any value differs by more than TOLERANCE.
 */
import { ITEMS, SETS, type LegendaryEntry } from "../src/core/catalog";
import { fetchBooks, fetchCoinsPerGem } from "../src/core/api";
import { TRACKED_BOOK_IDS, computeTracked } from "../src/core/compute";
import { GEM_PROBE_COINS } from "../src/core/gems";
import { legendaryRow } from "../src/core/legendary";
import { readFile } from "node:fs/promises";

const TOLERANCE = 0.01;
const SITE = "https://gw2pc.com";
const PATH: Record<string, string> = {
  gemstone: "amalgamated-gemstone",
  lodestone: "amalgamated-draconic-lodestone",
};

const text = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
function money(cellHtml: string): number | null {
  const first = cellHtml.replace(/<br\s*\/?>[\s\S]*$/, ""); // first line = per-unit price
  const m = /(?:(\d+)g)?\s*(?:(\d+)s)?\s*(?:(\d+)c)?/.exec(text(first));
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  return Number(m[1] ?? 0) * 10000 + Number(m[2] ?? 0) * 100 + Number(m[3] ?? 0);
}
const tables = (html: string) => [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
const rows = (table: string) => [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]!);
const cells = (row: string) => [...row.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)].map((m) => ({ attrs: m[1]!, html: m[2]! }));

async function page(path: string): Promise<string> {
  const r = await fetch(`${SITE}/${path}`);
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.text();
}

/** The cell at (hilight row, hilight column) of the first table that has a highlighted row. */
function highlighted(html: string): number | null {
  for (const t of tables(html))
    for (const r of rows(t)) {
      const cs = cells(r);
      if (cs[0]?.attrs.includes("price-table-hilight-row")) {
        const hit = cs.find((c, i) => i > 0 && c.attrs.includes("price-table-hilight-col"));
        return hit ? money(hit.html) : null;
      }
    }
  return null;
}

/**
 * Formula check for set pages: rebuild the set value from gw2pc's *own* per-material cells
 * (Σ price × 90% × 250) and compare it with their highlighted value. This isolates our formula
 * from data drift between the two sites' API reads.
 */
function setFormulaFromTheirCells(html: string, depth: number, percent: number): number | null {
  const first = tables(html)[0];
  if (!first) return null;
  const header = [...first.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => text(m[1]!));
  const col = header.indexOf(`Depth ${depth}`);
  if (col < 0) return null;
  let total = 0;
  for (const r of rows(first)) {
    const c = cells(r)[col];
    const v = c ? money(c.html) : null;
    if (v === null) continue;
    total += v * (percent / 100) * 250;
  }
  return total ? Math.round(total) : null;
}

type Result = { name: string; ours: number | null; theirs: number | null };
const diff = (r: Result) => (r.ours && r.theirs ? Math.abs(r.ours - r.theirs) / r.theirs : Infinity);

async function run(): Promise<Result[]> {
  const [books, cpg] = await Promise.all([fetchBooks(TRACKED_BOOK_IDS), fetchCoinsPerGem(GEM_PROBE_COINS)]);
  const ours = computeTracked(books, cpg);
  const out: Result[] = [];
  for (const slug of [...ITEMS.map((i) => i.slug), ...SETS.map((s) => s.slug)]) {
    const html = await page(PATH[slug] ?? slug);
    out.push({ name: slug, ours: ours[slug] ?? null, theirs: highlighted(html) });
    const set = SETS.find((s) => s.slug === slug);
    if (set)
      out.push({
        name: `formula ${slug} (from gw2pc's own cells)`,
        ours: setFormulaFromTheirCells(html, set.standardDepth, set.standardRatio[1]),
        theirs: highlighted(html),
      });
  }

  // Legendaries: the highlighted cell of the sell table, per item link.
  const legs = JSON.parse(await readFile("data/legendaries.json", "utf8")) as LegendaryEntry[];
  const legBooks = await fetchBooks(legs.map((l) => l.id));
  // gw2pc has a buy table and a sell table; only the sell table carries highlighted cells.
  const sellTable = tables(await page("leg")).find((t) => t.includes("Depth 1") && t.includes("price-table-hilight-col"));
  const theirsById = new Map<number, number | null>();
  for (const r of rows(sellTable ?? "").slice(1)) {
    const id = /item\/(\d+)/.exec(r)?.[1];
    const hit = cells(r).find((c) => c.attrs.includes("price-table-hilight-col"));
    if (id && hit) theirsById.set(Number(id), money(hit.html));
  }
  for (const l of legs) {
    if (!theirsById.has(l.id)) continue; // newer legendaries do not exist on gw2pc.com
    const b = legBooks.get(l.id);
    out.push({ name: `leg: ${l.name}`, ours: b ? legendaryRow(b).otc : null, theirs: theirsById.get(l.id) ?? null });
  }
  return out;
}

let results = await run();
if (results.some((r) => diff(r) > TOLERANCE)) {
  // The two sites read the order book seconds apart; give fast-moving books one more look.
  await new Promise((res) => setTimeout(res, 30_000));
  const second = await run();
  results = results.map((r) => {
    const again = second.find((s) => s.name === r.name);
    return again && diff(again) < diff(r) ? again : r;
  });
}

let bad = 0;
for (const r of results) {
  const d = diff(r);
  const flag = d > TOLERANCE ? "FAIL" : "ok  ";
  if (d > TOLERANCE) bad++;
  console.log(`${flag} ${r.name.padEnd(34)} ours=${r.ours?.toFixed(0) ?? "-"} gw2pc=${r.theirs ?? "-"} diff=${Number.isFinite(d) ? (d * 100).toFixed(2) + "%" : "n/a"}`);
}
console.log(`\n${results.length - bad}/${results.length} within ${TOLERANCE * 100}%`);
process.exit(bad ? 1 : 0);
