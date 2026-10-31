import type { Book, Listing, Side } from "./types";

/**
 * Port of gw2pc `ItemInfo._get_price`: walk the order book in the order the API
 * returns it (sells cheapest-first, buys best-first) and return the unit price of
 * the listing in which the running quantity first reaches `depth`.
 * Returns null when the book is not deep enough.
 */
export function depthPriceOf(listings: Listing[], depth: number): number | null {
  let seen = 0;
  for (const l of listings) {
    seen += l.quantity;
    if (seen >= depth) return l.unit_price;
  }
  return null;
}

export function depthPrice(book: Book, side: Side, depth: number): number | null {
  return depthPriceOf(side === "buy" ? book.buys : book.sells, depth);
}
