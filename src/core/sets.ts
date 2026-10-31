import { depthPrice } from "./depth";
import type { ValueFn } from "./otc";
import type { Book } from "./types";

export const SET_SIZE = 250;

/** Port of `MultiItemSetDepthRatioTable.get_price`: Σ price × ratio × 250 over every material. */
export function setValue(books: Book[]): ValueFn {
  return (side, depth, percent) => {
    let total = 0;
    for (const book of books) {
      const p = depthPrice(book, side, depth);
      if (p === null) return 0;
      total += p * (percent / 100) * SET_SIZE;
    }
    return total;
  };
}
