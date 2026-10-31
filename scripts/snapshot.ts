/**
 * Record Snapshots.
 *   tsx scripts/snapshot.ts            hourly: 9 items + T5/T6 sets + Gem price, then thin old hourly data
 *   tsx scripts/snapshot.ts --daily    daily: OTC price of every tradeable legendary
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { fetchBooks, fetchCoinsPerGem } from "../src/core/api";
import { TRACKED_BOOK_IDS, computeTracked } from "../src/core/compute";
import { GEM_PROBE_COINS } from "../src/core/gems";
import { legendaryRow } from "../src/core/legendary";
import { appendPoint, monthKey, thin, type Series } from "../src/core/snapshots";
import type { LegendaryEntry } from "../src/core/catalog";

const ROOT = "data/snapshots";
const now = Math.floor(Date.now() / 1000);
const daily = process.argv.includes("--daily");

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}
const writeJson = (path: string, data: unknown) => writeFile(path, JSON.stringify(data) + "\n");

async function readDir(dir: string): Promise<Record<string, Series>> {
  const out: Record<string, Series> = {};
  try {
    for (const f of await readdir(dir)) if (f.endsWith(".json")) out[f.slice(0, -5)] = await readJson(`${dir}/${f}`, {});
  } catch {
    /* directory does not exist yet */
  }
  return out;
}

if (daily) {
  const legs = await readJson<LegendaryEntry[]>("data/legendaries.json", []);
  if (!legs.length) throw new Error("data/legendaries.json is empty — run `pnpm discover` first");
  const books = await fetchBooks(legs.map((l) => l.id));
  const file = `${ROOT}/legendaries/${monthKey(now)}.json`;
  const series = await readJson<Series>(file, {});
  let n = 0;
  for (const l of legs) {
    const book = books.get(l.id);
    const otc = book ? legendaryRow(book).otc : null;
    if (otc) {
      appendPoint(series, String(l.id), now, Math.round(otc));
      n++;
    }
  }
  await mkdir(`${ROOT}/legendaries`, { recursive: true });
  await writeJson(file, series);
  console.log(`daily: ${n}/${legs.length} legendary prices -> ${file}`);
} else {
  const [books, coinsPerGem] = await Promise.all([fetchBooks(TRACKED_BOOK_IDS), fetchCoinsPerGem(GEM_PROBE_COINS)]);
  const tracked = computeTracked(books, coinsPerGem);

  const hourly = await readDir(`${ROOT}/hourly`);
  const month = monthKey(now);
  hourly[month] ??= {};
  for (const [k, v] of Object.entries(tracked)) appendPoint(hourly[month]!, k, now, v);

  const dailyStore = await readDir(`${ROOT}/daily`);
  const thinned = thin(hourly, dailyStore, now);

  await mkdir(`${ROOT}/hourly`, { recursive: true });
  await mkdir(`${ROOT}/daily`, { recursive: true });
  for (const f of await readdir(`${ROOT}/hourly`)) if (f.endsWith(".json") && !(f.slice(0, -5) in thinned.hourly)) await rm(`${ROOT}/hourly/${f}`);
  for (const [m, s] of Object.entries(thinned.hourly)) await writeJson(`${ROOT}/hourly/${m}.json`, s);
  for (const [y, s] of Object.entries(thinned.daily)) await writeJson(`${ROOT}/daily/${y}.json`, s);
  console.log(`hourly: ${Object.keys(tracked).length} series ->`, JSON.stringify(tracked));
}
