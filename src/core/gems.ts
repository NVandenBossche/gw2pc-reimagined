export const GEM_BATCH = 400;
/** Probe size (copper) for the coins→gems exchange: 1600g is comfortably enough for 400 gems. */
export const GEM_PROBE_COINS = 16_000_000;

/** Gold (copper) needed to buy 400 gems: coins_per_gem × 400 from `/v2/commerce/exchange/coins`. */
export function gemPrice(coinsPerGem: number): number {
  return coinsPerGem * GEM_BATCH;
}
