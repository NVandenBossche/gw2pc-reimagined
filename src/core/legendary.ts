import { depthPrice } from "./depth";
import type { Book } from "./types";

export const LEG_DEPTHS = [1, 2, 3, 5] as const;
export const LEG_SELL_PERCENT = 85;
/** 45g in copper — a step must beat this to move the Standard depth up. */
export const LEG_STEP_THRESHOLD = 450000;
export const LEG_MAX_STANDARD_DEPTH = 3;

export type LegendaryRow = {
  sell: Record<number, number | null>; // already × 85%
  rawSell: Record<number, number | null>; // 100% sell
  buy: Record<number, number | null>; // 100% buy
  standardDepth: number;
  otc: number | null;
};

/** Port of `BigMoneyWeaponView.init_table`'s per-item highlight rule. */
export function legendaryRow(book: Book, percent = LEG_SELL_PERCENT): LegendaryRow {
  const sell: Record<number, number | null> = {};
  const buy: Record<number, number | null> = {};
  const rawSell: Record<number, number | null> = {};
  let hilight = LEG_DEPTHS[0] as number;
  let locked = false;
  for (const depth of LEG_DEPTHS) {
    const raw = depthPrice(book, "sell", depth);
    const price = raw === null ? null : raw * (percent / 100);
    sell[depth] = price;
    rawSell[depth] = raw;
    if (price && !locked && depth !== hilight && depth <= LEG_MAX_STANDARD_DEPTH) {
      if (price - (sell[hilight] ?? 0) > LEG_STEP_THRESHOLD) hilight = depth;
      else locked = true;
    }
    buy[depth] = depthPrice(book, "buy", depth);
  }
  const otc = sell[hilight] ?? null;
  return { sell, rawSell, buy, standardDepth: hilight, otc: otc && otc > 0 ? otc : null };
}
