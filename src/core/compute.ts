import { ITEMS, SETS, type ItemConfig, type SetConfig } from "./catalog";
import { gemPrice } from "./gems";
import { buildTable, otcPrice, singleItemValue, type TableRow } from "./otc";
import { setValue } from "./sets";
import type { Book } from "./types";

export type Books = Map<number, Book>;

/** Every book id the home/item/set pages need. */
export const TRACKED_BOOK_IDS: number[] = [
  ...ITEMS.map((i) => i.id),
  ...SETS.flatMap((s) => s.materials.map((m) => m.id)),
];

export function itemRows(item: ItemConfig, books: Books): TableRow[] | null {
  const book = books.get(item.id);
  return book ? buildTable(singleItemValue(book), item.depths) : null;
}

export function setRows(set: SetConfig, books: Books): TableRows | null {
  const mats = set.materials.map((m) => books.get(m.id));
  if (mats.some((b) => !b)) return null;
  return buildTable(setValue(mats as Book[]), set.depths);
}
type TableRows = TableRow[];

/** OTC price (copper) of every hourly-tracked series: 9 items, T5, T6 and the Gem price. */
export function computeTracked(books: Books, coinsPerGem: number | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of ITEMS) {
    const rows = itemRows(item, books);
    if (rows) out[item.slug] = Math.round(otcPrice(rows, item.standardDepth, item.standardRatio));
  }
  for (const set of SETS) {
    const rows = setRows(set, books);
    if (rows) out[set.slug] = Math.round(otcPrice(rows, set.standardDepth, set.standardRatio));
  }
  if (coinsPerGem) out.gem = gemPrice(coinsPerGem);
  return out;
}

export const TRACKED_KEYS: string[] = [...ITEMS.map((i) => i.slug), ...SETS.map((s) => s.slug), "gem"];
