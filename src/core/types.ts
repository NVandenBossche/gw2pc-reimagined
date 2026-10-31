export type Listing = { unit_price: number; quantity: number };
export type Book = { id: number; buys: Listing[]; sells: Listing[] };
export type Side = "buy" | "sell";
/** [side, percent] — e.g. ["sell", 90] is "90% Sell". */
export type Ratio = readonly [Side, number];
