import { ratioKey, roiLevel, type TableRow } from "../../core/otc";
import type { Ratio } from "../../core/types";
import { Delta, Money } from "./Money";

const COLS: { key: string; label: string }[] = [
  { key: "100buy", label: "100% Buy" },
  { key: "85sell", label: "85% Sell" },
  { key: "90sell", label: "90% Sell" },
  { key: "100sell", label: "100% Sell" },
];

type Props = {
  rows: TableRow[];
  standardDepth: number;
  standardRatio: Ratio;
  /** Show a second line with the price of a stack (single items). */
  stack?: number;
};

export function PriceTable({ rows, standardDepth, standardRatio, stack }: Props) {
  const stdKey = ratioKey(standardRatio[0], standardRatio[1]);
  return (
    <div className="table-wrap">
      <table className="ledger">
        <thead>
          <tr>
            <th scope="col" className="l">
              Depth
            </th>
            {COLS.map((c) => (
              <th key={c.key} scope="col" className={c.key === stdKey ? "std-col" : ""}>
                {c.label}
              </th>
            ))}
            <th scope="col">Flip ROI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.depth} className={r.depth === standardDepth ? "std-row" : ""}>
              <th scope="row" className="l num">
                {r.depth.toLocaleString("en")}
              </th>
              {COLS.map((c) => {
                const v = r.cells[c.key] ?? 0;
                const isOtc = r.depth === standardDepth && c.key === stdKey;
                return (
                  <td key={c.key} className={isOtc ? "otc" : ""}>
                    <Money c={Math.trunc(v)} />
                    {stack && v > 0 && (
                      <span className="stack">
                        <Money c={Math.trunc(v * stack)} />
                      </span>
                    )}
                  </td>
                );
              })}
              <td className={`roi roi-${roiLevel(r.roi)}`}>{r.roi === null ? <span className="muted">–</span> : <Delta v={r.roi} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
