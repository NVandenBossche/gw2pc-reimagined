/** Set 2 went live on 15 Sep 2026 (Code of Creation). Edit this one value if ArenaNet shifts a switch. */
export const KIT_ANCHOR = { set: 2, year: 2026, month: 9, day: 15 } as const;
export const KIT_SETS = 10;
export const KIT_SWITCH_MONTHS = 3;
export const KIT_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC instant when the `step`-th switch after the anchor happens (negative = before it). */
const switchAt = (step: number) =>
  Date.UTC(KIT_ANCHOR.year, KIT_ANCHOR.month - 1 + step * KIT_SWITCH_MONTHS, KIT_ANCHOR.day);

/** True when `at` falls in the 30 days before `releaseSet` next goes live (UTC). No release set → never. */
export function inKitWindow(releaseSet: number | undefined, at: Date): boolean {
  if (releaseSet === undefined) return false;
  const t = at.getTime();
  // Steps whose set number equals releaseSet are KIT_SETS apart; find the first one after `t`.
  const offset = (((releaseSet - KIT_ANCHOR.set) % KIT_SETS) + KIT_SETS) % KIT_SETS;
  let step = offset - KIT_SETS * 20;
  while (switchAt(step) <= t) step += KIT_SETS;
  return switchAt(step) - t <= KIT_WINDOW_DAYS * DAY_MS;
}
