import { depthPrice } from "./depth";
import type { Book, Ratio, Side } from "./types";

export const DEFAULT_RATIOS: readonly Ratio[] = [
  ["buy", 100],
  ["sell", 85],
  ["sell", 90],
  ["sell", 100],
];

export const ratioKey = (side: Side, percent: number) => `${percent}${side}`;

/** Value of one cell: price at depth × percent, 0 when there is no data. */
export type ValueFn = (side: Side, depth: number, percent: number) => number;

export function singleItemValue(book: Book): ValueFn {
  return (side, depth, percent) => {
    const p = depthPrice(book, side, depth);
    return p === null ? 0 : p * (percent / 100);
  };
}

export type TableRow = {
  depth: number;
  cells: Record<string, number>;
  flippable: boolean;
  roi: number | null;
};

export type FlipThresholds = { highlight: number; strong: number };
export const FLIP_THRESHOLDS: FlipThresholds = { highlight: 0, strong: 0.1 };

/**
 * Port of gw2pc `DepthRatioTable.get_table`: one column per ratio, one row per depth.
 * A depth with no data takes the last non-zero price found at a lower depth.
 */
export function buildTable(
  value: ValueFn,
  depths: readonly number[],
  ratios: readonly Ratio[] = DEFAULT_RATIOS,
): TableRow[] {
  const rows: TableRow[] = depths.map((depth) => ({ depth, cells: {}, flippable: false, roi: null }));
  for (const [side, percent] of ratios) {
    let last = 0;
    rows.forEach((row, i) => {
      let v = value(side, depths[i]!, percent);
      if (v !== 0) last = v;
      else v = last;
      row.cells[ratioKey(side, percent)] = v;
    });
  }
  for (const row of rows) {
    const buy = row.cells[ratioKey("buy", 100)] ?? 0;
    const sell = row.cells[ratioKey("sell", 85)] ?? 0;
    row.flippable = buy > 0 && buy < sell;
    row.roi = row.flippable ? (sell - buy) / buy : null;
  }
  return rows;
}

/** The OTC price: the cell at the item's Standard depth and Standard ratio. */
export function otcPrice(rows: TableRow[], depth: number, ratio: Ratio = ["sell", 90]): number {
  return rows.find((r) => r.depth === depth)?.cells[ratioKey(ratio[0], ratio[1])] ?? 0;
}

export type RoiLevel = "none" | "positive" | "strong";
export function roiLevel(roi: number | null, t: FlipThresholds = FLIP_THRESHOLDS): RoiLevel {
  if (roi === null || roi <= t.highlight) return "none";
  return roi >= t.strong ? "strong" : "positive";
}
