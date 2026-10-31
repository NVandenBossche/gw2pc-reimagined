import { formatGold, formatGoldSilver } from "../../core/money";

/** Copper → "12g 05s 03c" with the coin letters tinted. `gs` rounds to the nearest silver (legendaries). */
export function Money({ c, gs = false }: { c: number | null | undefined; gs?: boolean }) {
  if (c === null || c === undefined || (!c && c !== 0)) return <span className="muted">–</span>;
  const s = gs ? formatGoldSilver(c) : formatGold(c);
  return (
    <span className="money">
      {s.split(" ").map((tok) => (
        <span key={tok} className="coin">
          {tok.slice(0, -1)}
          <span className={`u u-${tok.slice(-1)}`}>{tok.slice(-1)}</span>
        </span>
      ))}
    </span>
  );
}

export function Delta({ v, digits = 1 }: { v: number | null | undefined; digits?: number }) {
  if (v === null || v === undefined || !Number.isFinite(v)) return <span className="muted">–</span>;
  const pct = v * 100;
  const cls = Math.abs(pct) < 0.05 ? "flat" : pct > 0 ? "pos" : "neg";
  const sign = pct > 0.05 ? "+" : pct < -0.05 ? "−" : "";
  return <span className={`delta ${cls}`}>{`${sign}${Math.abs(pct).toFixed(digits)}%`}</span>;
}
