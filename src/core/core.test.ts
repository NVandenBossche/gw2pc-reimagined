import { describe, expect, it } from "vitest";
import { depthPrice } from "./depth";
import { formatGold, formatGoldSilver, parseGold, roundHalfEven } from "./money";
import { buildTable, otcPrice, roiLevel, singleItemValue } from "./otc";
import { setValue } from "./sets";
import { legendaryRow } from "./legendary";
import { payAll, payMix, receive } from "./payment";
import { average, change, daysOfHistory, economyIndex } from "./trends";
import { gemPrice } from "./gems";
import type { Book } from "./types";

const book = (sells: [number, number][], buys: [number, number][] = [], id = 1): Book => ({
  id,
  sells: sells.map(([unit_price, quantity]) => ({ unit_price, quantity })),
  buys: buys.map(([unit_price, quantity]) => ({ unit_price, quantity })),
});

describe("depth walk (port of ItemInfo._get_price)", () => {
  const b = book([[100, 1], [150, 1], [200, 3]], [[90, 2], [80, 10]]);
  it("returns the price of the listing where the running quantity reaches the depth", () => {
    expect(depthPrice(b, "sell", 1)).toBe(100);
    expect(depthPrice(b, "sell", 2)).toBe(150);
    expect(depthPrice(b, "sell", 3)).toBe(200);
    expect(depthPrice(b, "sell", 5)).toBe(200);
    expect(depthPrice(b, "buy", 2)).toBe(90);
    expect(depthPrice(b, "buy", 3)).toBe(80);
  });
  it("is null when the book is too shallow", () => {
    expect(depthPrice(b, "sell", 6)).toBeNull();
    expect(depthPrice(book([]), "sell", 1)).toBeNull();
  });
});

describe("money formatting (gw2pc parity)", () => {
  it("formatGold truncates to copper", () => {
    expect(formatGold(120503)).toBe("12g 05s 03c");
    expect(formatGold(1234)).toBe("12s 34c");
    expect(formatGold(99)).toBe("99c");
    expect(formatGold(0)).toBe("0c");
    expect(formatGold(null)).toBe("0c");
    expect(formatGold(170.5)).toBe("1s 70c");
  });
  it("formatGoldSilver rounds half to even like Python", () => {
    expect(roundHalfEven(2.5)).toBe(2);
    expect(roundHalfEven(3.5)).toBe(4);
    expect(formatGoldSilver(150)).toBe("2s");
    expect(formatGoldSilver(250)).toBe("2s");
    expect(formatGoldSilver(1700000)).toBe("170g 00s");
    expect(formatGoldSilver(0)).toBe("0s");
  });
  it("parses gold input", () => {
    expect(parseGold("12g 5s 3c")).toBe(120503);
    expect(parseGold("500g")).toBe(5_000_000);
    expect(parseGold("500")).toBe(5_000_000);
    expect(parseGold("2.5")).toBe(25_000);
    expect(parseGold("")).toBeNull();
    expect(parseGold("abc")).toBeNull();
  });
});

describe("OTC table (port of DepthRatioTable)", () => {
  const b = book([[100, 1], [150, 1], [200, 3]], [[90, 2], [80, 10]]);
  const rows = buildTable(singleItemValue(b), [1, 3, 6]);
  it("applies ratio × depth price", () => {
    expect(rows[0]!.cells["100buy"]).toBe(90);
    expect(rows[0]!.cells["85sell"]).toBeCloseTo(85);
    expect(rows[1]!.cells["85sell"]).toBeCloseTo(170);
    expect(rows[1]!.cells["90sell"]).toBeCloseTo(180);
  });
  it("fills a depth with no data from the last non-zero price", () => {
    expect(rows[2]!.cells["100sell"]).toBe(200);
    expect(rows[2]!.cells["85sell"]).toBeCloseTo(170);
  });
  it("reads the OTC price at the standard depth and ratio", () => {
    expect(otcPrice(rows, 3)).toBeCloseTo(180);
    expect(otcPrice(rows, 3, ["sell", 85])).toBeCloseTo(170);
    expect(otcPrice(rows, 999)).toBe(0);
  });
  it("marks rows flippable only when 100% buy < 85% sell, with ROI", () => {
    expect(rows[0]!.flippable).toBe(false); // 90 !< 85
    expect(rows[0]!.roi).toBeNull();
    expect(rows[1]!.flippable).toBe(true); // 80 < 170
    expect(rows[1]!.roi).toBeCloseTo((170 - 80) / 80);
  });
  it("grades ROI: >0 highlighted, >=10% strong", () => {
    expect(roiLevel(null)).toBe("none");
    expect(roiLevel(0)).toBe("none");
    expect(roiLevel(0.04)).toBe("positive");
    expect(roiLevel(0.1)).toBe("strong");
    expect(roiLevel(1.125)).toBe("strong");
  });
});

describe("set price (Σ price × ratio × 250)", () => {
  const a = book([[100, 1000]], [[50, 1000]], 1);
  const b = book([[200, 1000]], [[60, 1000]], 2);
  const v = setValue([a, b]);
  it("sums every material times 250", () => {
    expect(v("sell", 250, 100)).toBeCloseTo((100 + 200) * 250);
    expect(v("sell", 250, 90)).toBeCloseTo((100 * 0.9 + 200 * 0.9) * 250);
    expect(v("buy", 1, 100)).toBeCloseTo((50 + 60) * 250);
  });
  it("is 0 when any material book is too shallow", () => {
    expect(v("sell", 5000, 100)).toBe(0);
  });
});

describe("legendary standard depth rule (port of BigMoneyWeaponView)", () => {
  it("moves up while each step beats 45g and stops once a step is small", () => {
    const r = legendaryRow(book([[1_000_000, 1], [2_000_000, 1], [2_100_000, 1]]));
    expect(r.sell[1]).toBeCloseTo(850_000);
    expect(r.sell[2]).toBeCloseTo(1_700_000);
    expect(r.sell[3]).toBeCloseTo(1_785_000);
    expect(r.sell[5]).toBeNull();
    expect(r.standardDepth).toBe(2);
    expect(r.otc).toBeCloseTo(1_700_000);
  });
  it("stays at depth 1 when the second listing is close", () => {
    const r = legendaryRow(book([[1_000_000, 1], [1_100_000, 1]]));
    expect(r.standardDepth).toBe(1);
    expect(r.otc).toBeCloseTo(850_000);
  });
  it("can reach depth 3 but never 5", () => {
    const r = legendaryRow(book([[1_000_000, 1], [2_000_000, 1], [3_000_000, 1], [9_000_000, 2]]));
    expect(r.standardDepth).toBe(3);
    expect(r.sell[5]).toBeCloseTo(9_000_000 * 0.85);
  });
  it("has no OTC price without listings", () => {
    expect(legendaryRow(book([])).otc).toBeNull();
  });
});

describe("payment calculator", () => {
  const p = { ecto: 1600, mc: 2500, t6set: 1_000_000 };
  const amount = 5_000_000; // 500g
  it("pays entirely in one item, rounding to the nearest unit", () => {
    expect(payAll(amount, "ecto", p).quantity).toBe(3125);
    expect(payAll(amount, "ecto", p).stacks).toEqual({ stacks: 12, rest: 125 });
    expect(payAll(amount, "mc", p).quantity).toBe(2000);
    expect(payAll(amount, "gold", p).quantity).toBe(amount);
    expect(payAll(5_001_000, "mc", p).quantity).toBe(2000); // 2000.4 → 2000
  });
  it("mix: raw gold is the default filler", () => {
    const r = payMix(amount, { t6Sets: 2, ectoStacks: 3 }, "gold", p);
    expect(r.goldCopper).toBe(1_800_000);
    expect(r.paid).toBe(amount);
    expect(r.over).toBe(false);
  });
  it("mix: another item can be the filler, rounding is waived", () => {
    const exact = payMix(amount, { t6Sets: 2, ectoStacks: 3 }, "mc", p);
    expect(exact.mc).toBe(720);
    const off = payMix(5_000_001, { t6Sets: 2, ectoStacks: 3 }, "mc", p);
    expect(off.mc).toBe(720);
    expect(off.paid).toBe(5_000_000);
  });
  it("mix: flags overpayment and zeroes the filler", () => {
    const r = payMix(amount, { t6Sets: 6 }, "gold", p);
    expect(r.over).toBe(true);
    expect(r.goldCopper).toBe(0);
  });
  it("reverse: values a received bundle", () => {
    expect(receive({ ecto: 100, mc: 10, gold: 5000 }, p)).toBe(190_000);
    expect(receive({}, p)).toBe(0);
  });
});

describe("gem price", () => {
  it("is 400 gems at the exchange rate", () => {
    expect(gemPrice(3982)).toBe(1_592_800);
  });
});

describe("trends", () => {
  const D = 86400;
  const pts = Array.from({ length: 31 }, (_, i) => ({ t: i * D, v: 100 + i }));
  const now = 30 * D;
  it("computes averages and changes", () => {
    expect(average(pts, now, 7)).toBeCloseTo((123 + 124 + 125 + 126 + 127 + 128 + 129 + 130) / 8);
    expect(change(pts, now, 1)).toBeCloseTo((130 - 129) / 129);
    expect(change(pts, now, 7)).toBeCloseTo((130 - 123) / 123);
    expect(daysOfHistory(pts)).toBe(30);
  });
  it("returns null change when history does not reach back", () => {
    expect(change(pts.slice(-3), now, 7)).toBeNull();
    expect(change([], now, 1)).toBeNull();
  });
  it("builds an equal-weight index based at 100", () => {
    const a = [{ t: 0, v: 100 }, { t: 1, v: 110 }];
    const b = [{ t: 0, v: 200 }, { t: 1, v: 200 }];
    const idx = economyIndex([a, b]);
    expect(idx[0]!.v).toBe(100);
    expect(idx[1]!.v).toBeCloseTo(105);
    expect(economyIndex([a, []])).toEqual([]);
  });
});

import { thin, collapseToDaily, mergeSeries, monthKey } from "./snapshots";
import { computeTracked } from "./compute";

describe("snapshots", () => {
  const D = 86400;
  const t0 = Date.UTC(2026, 0, 1) / 1000; // 2026-01-01
  it("collapses to the last point of each UTC day", () => {
    const pts: [number, number][] = [[t0, 1], [t0 + 3600, 2], [t0 + D, 3]];
    expect(collapseToDaily(pts)).toEqual([[t0 + 3600, 2], [t0 + D, 3]]);
  });
  it("thins hourly points older than 30 days into the daily store", () => {
    const now = t0 + 60 * D;
    const hourly = {
      "2026-01": { mc: [[t0, 10], [t0 + 3600, 11], [t0 + 40 * D, 12]] as [number, number][] },
      "2026-02": { mc: [[now - 3600, 13]] as [number, number][] },
    };
    const r = thin(hourly, {}, now);
    expect(r.daily["2026"]!.mc).toEqual([[t0 + 3600, 11]]);
    expect(r.hourly["2026-01"]!.mc).toEqual([[t0 + 40 * D, 12]]);
    expect(r.hourly["2026-02"]!.mc).toEqual([[now - 3600, 13]]);
  });
  it("drops emptied hourly months and keeps thinning idempotent", () => {
    const now = t0 + 90 * D;
    const once = thin({ "2026-01": { mc: [[t0, 10]] as [number, number][] } }, {}, now);
    expect(once.hourly).toEqual({});
    const twice = thin(once.hourly, once.daily, now);
    expect(twice.daily).toEqual(once.daily);
  });
  it("merges series with later parts winning on equal timestamps", () => {
    const m = mergeSeries({ a: [[1, 1], [2, 2]] }, { a: [[2, 9], [3, 3]], b: [[1, 5]] });
    expect(m.a).toEqual([[1, 1], [2, 9], [3, 3]]);
    expect(m.b).toEqual([[1, 5]]);
    expect(monthKey(t0)).toBe("2026-01");
  });
});

describe("computeTracked", () => {
  it("computes the OTC price of each series and skips missing books", () => {
    const mc = book([[1000, 5000]], [[900, 5000]], 19976);
    const books = new Map([[19976, mc]]);
    const r = computeTracked(books, 3982);
    expect(r.mc).toBe(900); // 90% of 1000 at depth 2500
    expect(r.ecto).toBeUndefined();
    expect(r.t6).toBeUndefined();
    expect(r.gem).toBe(1_592_800);
  });
});
