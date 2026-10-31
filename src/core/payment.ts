export const ECTO_STACK = 250;

/** OTC prices in copper: per Ecto, per Mystic Coin, per whole T6 set. */
export type PayPrices = { ecto: number; mc: number; t6set: number };

export type FillerKind = "gold" | "mc" | "ecto" | "t6";

/** Quantities typed in by the user. Omitted/undefined lines are not part of the mix. */
export type MixInput = {
  t6Sets?: number;
  ectoStacks?: number;
  mc?: number;
  /** Raw gold in copper, only when gold is not the filler. */
  gold?: number;
};

export type MixResult = {
  t6Sets: number;
  ectoStacks: number;
  mc: number;
  goldCopper: number;
  filler: FillerKind;
  /** Copper paid in total after rounding (may differ slightly from the amount; the difference is waived). */
  paid: number;
  /** True when the fixed lines already exceed the amount. */
  over: boolean;
};

const nearest = (x: number) => Math.round(x);

/** Entire payment in one item: Ecto and MC in individual units, gold exact. */
export function payAll(amount: number, kind: "ecto" | "mc" | "gold", p: PayPrices): { quantity: number; stacks?: { stacks: number; rest: number } } {
  if (kind === "gold") return { quantity: amount };
  const unit = kind === "ecto" ? p.ecto : p.mc;
  const quantity = unit > 0 ? nearest(amount / unit) : 0;
  if (kind === "ecto") return { quantity, stacks: { stacks: Math.floor(quantity / ECTO_STACK), rest: quantity % ECTO_STACK } };
  return { quantity };
}

/** Payment mix: the filler line is worked out from what the typed-in lines leave unpaid. */
export function payMix(amount: number, input: MixInput, filler: FillerKind, p: PayPrices): MixResult {
  const t6 = filler === "t6" ? 0 : Math.max(0, input.t6Sets ?? 0);
  const ecto = filler === "ecto" ? 0 : Math.max(0, input.ectoStacks ?? 0);
  const mc = filler === "mc" ? 0 : Math.max(0, input.mc ?? 0);
  const gold = filler === "gold" ? 0 : Math.max(0, input.gold ?? 0);

  const fixed = t6 * p.t6set + ecto * ECTO_STACK * p.ecto + mc * p.mc + gold;
  const remainder = amount - fixed;
  const over = remainder < 0;
  const rest = Math.max(0, remainder);

  const res: MixResult = { t6Sets: t6, ectoStacks: ecto, mc, goldCopper: gold, filler, paid: 0, over };
  if (filler === "gold") res.goldCopper = Math.round(rest);
  else if (filler === "mc") res.mc = p.mc > 0 ? nearest(rest / p.mc) : 0;
  else if (filler === "ecto") res.ectoStacks = p.ecto > 0 ? nearest(rest / (ECTO_STACK * p.ecto)) : 0;
  else res.t6Sets = p.t6set > 0 ? nearest(rest / p.t6set) : 0;

  res.paid = res.t6Sets * p.t6set + res.ectoStacks * ECTO_STACK * p.ecto + res.mc * p.mc + res.goldCopper;
  return res;
}

/** Reverse direction: what is a received bundle worth? Ecto and MC in units, gold in copper. */
export function receive(items: { ecto?: number; mc?: number; gold?: number }, p: PayPrices): number {
  return (items.ecto ?? 0) * p.ecto + (items.mc ?? 0) * p.mc + (items.gold ?? 0);
}
