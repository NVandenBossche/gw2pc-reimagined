/** Python-style round(): ties go to the even integer (gw2pc uses Python's round). */
export function roundHalfEven(x: number): number {
  const f = Math.floor(x);
  const diff = x - f;
  if (diff < 0.5) return f;
  if (diff > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

/** gw2pc `format_gold_text`: whole copper, truncated. "12g 05s 03c". */
export function formatGold(value: number | null | undefined): string {
  const v = value ?? 0;
  const copper = Math.trunc(v % 100);
  const rest = (v - copper) / 100;
  const silver = Math.trunc(rest % 100);
  const gold = Math.trunc((rest - silver) / 100);
  if (gold) return `${gold}g ${String(silver).padStart(2, "0")}s ${String(copper).padStart(2, "0")}c`;
  if (silver) return `${silver}s ${String(copper).padStart(2, "0")}c`;
  if (copper) return `${copper}c`;
  return "0c";
}

/** gw2pc `format_gold_text_gs`: rounded to the nearest silver. "12g 05s". */
export function formatGoldSilver(value: number | null | undefined): string {
  const silversTotal = roundHalfEven((value ?? 0) / 100);
  const silver = silversTotal % 100;
  const gold = Math.trunc((silversTotal - silver) / 100);
  if (gold) return `${gold}g ${String(silver).padStart(2, "0")}s`;
  if (silver) return `${silver}s`;
  return "0s";
}

/** Parse "12g 5s 3c" / "12g" / "1250" (gold if bare number) into copper. */
export function parseGold(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s) * 10000);
  const m = /^(?:(\d+)\s*g)?\s*(?:(\d+)\s*s)?\s*(?:(\d+)\s*c)?$/.exec(s);
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  return Number(m[1] ?? 0) * 10000 + Number(m[2] ?? 0) * 100 + Number(m[3] ?? 0);
}
