/** Find every tradeable legendary weapon (+ the include-list) and write data/legendaries.json. */
import { mkdir, writeFile } from "node:fs/promises";
import { LEGENDARY_GEN3_PREFIX, LEGENDARY_INCLUDE, LEGENDARY_OTHER_NAMES, type LegendaryEntry } from "../src/core/catalog";

type ApiItem = { id: number; name: string; type: string; rarity: string; details?: { type?: string } };

async function getJson<T>(url: string): Promise<T> {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url);
    if (r.ok) return (await r.json()) as T;
    await new Promise((res) => setTimeout(res, 500 * (i + 1)));
  }
  throw new Error(`failed: ${url}`);
}

const ids = await getJson<number[]>("https://api.guildwars2.com/v2/commerce/prices");
const chunks: number[][] = [];
for (let i = 0; i < ids.length; i += 200) chunks.push(ids.slice(i, i + 200));

const found: ApiItem[] = [];
for (let i = 0; i < chunks.length; i += 6) {
  const batch = await Promise.all(
    chunks.slice(i, i + 6).map((c) => getJson<ApiItem[]>(`https://api.guildwars2.com/v2/items?ids=${c.join(",")}`)),
  );
  for (const items of batch)
    for (const it of items)
      if (it.rarity === "Legendary" && (it.type === "Weapon" || LEGENDARY_INCLUDE.includes(it.id))) found.push(it);
}

const entries: LegendaryEntry[] = found
  .map((it): LegendaryEntry => {
    const gen =
      it.type !== "Weapon" || LEGENDARY_OTHER_NAMES.includes(it.name)
        ? "other"
        : it.name.startsWith(LEGENDARY_GEN3_PREFIX)
          ? 3
          : 1;
    return { id: it.id, name: it.name, gen, kind: it.details?.type ?? it.type };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

await mkdir("data", { recursive: true });
await writeFile("data/legendaries.json", JSON.stringify(entries, null, 1) + "\n");
const by = (g: string | number) => entries.filter((e) => e.gen === g).length;
console.log(`${entries.length} legendaries: gen1=${by(1)} gen3=${by(3)} other=${by("other")}`);
