import type { Book } from "./types";

const BASE = "https://api.guildwars2.com/v2";

async function getJson<T>(url: string, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return (await r.json()) as T;
      lastErr = new Error(`${r.status} ${url}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((res) => setTimeout(res, 300 * (i + 1)));
  }
  throw lastErr;
}

/** Order books for many items, batched 200 ids per request. */
export async function fetchBooks(ids: readonly number[]): Promise<Map<number, Book>> {
  const out = new Map<number, Book>();
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    const data = await getJson<Book[]>(`${BASE}/commerce/listings?ids=${chunk.join(",")}`);
    for (const b of data) out.set(b.id, b);
  }
  return out;
}

export type ItemInfo = { id: number; name: string; icon: string };
export async function fetchItems(ids: readonly number[]): Promise<Map<number, ItemInfo>> {
  const out = new Map<number, ItemInfo>();
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    const data = await getJson<ItemInfo[]>(`${BASE}/items?ids=${chunk.join(",")}`);
    for (const it of data) out.set(it.id, it);
  }
  return out;
}

export async function fetchCoinsPerGem(probeCoins: number): Promise<number> {
  const d = await getJson<{ coins_per_gem: number }>(`${BASE}/commerce/exchange/coins?quantity=${probeCoins}`);
  return d.coins_per_gem;
}
