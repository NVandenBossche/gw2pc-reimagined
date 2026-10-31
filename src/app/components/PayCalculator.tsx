import { useMemo, useState } from "react";
import { ECTO_STACK, payAll, payMix, receive, type FillerKind, type PayPrices } from "../../core/payment";
import { formatGold, parseGold } from "../../core/money";
import { usePrices } from "../prices";
import { Money } from "./Money";

type Direction = "pay" | "receive";
type PayKind = "ecto" | "mc" | "gold" | "mix";

const int = (s: string) => {
  const n = Math.floor(Number(s.replace(/[^\d]/g, "")));
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number) => n.toLocaleString("en");

function Seg<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[]; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function PayCalculator() {
  const { tracked } = usePrices();
  const prices: PayPrices | null =
    tracked.ecto && tracked.mc && tracked.t6 ? { ecto: tracked.ecto, mc: tracked.mc, t6set: tracked.t6 } : null;

  const [dir, setDir] = useState<Direction>("pay");
  const [kind, setKind] = useState<PayKind>("ecto");
  const [amountText, setAmountText] = useState("");
  const [filler, setFiller] = useState<FillerKind>("gold");
  const [t6, setT6] = useState("");
  const [stacks, setStacks] = useState("");
  const [mc, setMc] = useState("");
  const [goldText, setGoldText] = useState("");
  const [rEcto, setREcto] = useState("");
  const [rMc, setRMc] = useState("");
  const [rGold, setRGold] = useState("");

  const amount = parseGold(amountText);
  const amountBad = amountText.trim() !== "" && amount === null;

  const paying = useMemo(() => {
    if (!prices || amount === null) return null;
    if (kind === "mix")
      return { mix: payMix(amount, { t6Sets: int(t6), ectoStacks: int(stacks), mc: int(mc), gold: parseGold(goldText) ?? 0 }, filler, prices) };
    return { single: payAll(amount, kind, prices) };
  }, [prices, amount, kind, t6, stacks, mc, goldText, filler]);

  const received = useMemo(
    () => (prices ? receive({ ecto: int(rEcto), mc: int(rMc), gold: parseGold(rGold) ?? 0 }, prices) : null),
    [prices, rEcto, rMc, rGold],
  );

  if (!prices) return <p className="muted">Waiting for prices…</p>;

  return (
    <div className="calc">
      <Seg
        label="Direction"
        value={dir}
        onChange={setDir}
        options={[
          { v: "pay", label: "I pay" },
          { v: "receive", label: "I receive" },
        ]}
      />

      {dir === "pay" ? (
        <>
          <Field id="amount" label="Amount owed" hint="e.g. 500g, 120g 50s, or just 500 (gold)">
            <input id="amount" inputMode="text" autoComplete="off" value={amountText} onChange={(e) => setAmountText(e.target.value)} placeholder="500g" aria-invalid={amountBad} />
          </Field>
          {amountBad && <p className="error">Could not read that amount. Try “500g” or “120g 50s”.</p>}

          <Seg
            label="Pay with"
            value={kind}
            onChange={setKind}
            options={[
              { v: "ecto", label: "All Ecto" },
              { v: "mc", label: "All MC" },
              { v: "gold", label: "All gold" },
              { v: "mix", label: "Mix" },
            ]}
          />

          {kind === "mix" && (
            <div className="mix">
              <Field id="mix-t6" label="T6 sets" hint="whole sets (8 × 250)">
                <input id="mix-t6" inputMode="numeric" value={filler === "t6" ? "" : t6} onChange={(e) => setT6(e.target.value)} disabled={filler === "t6"} placeholder={filler === "t6" ? "filler" : "0"} />
              </Field>
              <Field id="mix-ecto" label="Ecto stacks" hint={`stacks of ${ECTO_STACK}`}>
                <input id="mix-ecto" inputMode="numeric" value={filler === "ecto" ? "" : stacks} onChange={(e) => setStacks(e.target.value)} disabled={filler === "ecto"} placeholder={filler === "ecto" ? "filler" : "0"} />
              </Field>
              <Field id="mix-mc" label="Mystic Coins" hint="individual coins">
                <input id="mix-mc" inputMode="numeric" value={filler === "mc" ? "" : mc} onChange={(e) => setMc(e.target.value)} disabled={filler === "mc"} placeholder={filler === "mc" ? "filler" : "0"} />
              </Field>
              <Field id="mix-gold" label="Raw gold">
                <input id="mix-gold" value={filler === "gold" ? "" : goldText} onChange={(e) => setGoldText(e.target.value)} disabled={filler === "gold"} placeholder={filler === "gold" ? "filler" : "0g"} />
              </Field>
              <Field id="filler" label="Filler (covers the rest)">
                <select id="filler" value={filler} onChange={(e) => setFiller(e.target.value as FillerKind)}>
                  <option value="gold">Raw gold</option>
                  <option value="mc">Mystic Coins</option>
                  <option value="ecto">Ecto stacks</option>
                  <option value="t6">T6 sets</option>
                </select>
              </Field>
            </div>
          )}

          {paying && amount !== null && (
            <table className="ledger result" aria-live="polite">
              <thead>
                <tr>
                  <th className="l" scope="col">
                    You hand over
                  </th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {"single" in paying && paying.single && (
                  <>
                    {kind === "ecto" && (
                      <tr>
                        <th scope="row" className="l">
                          Globs of Ectoplasm
                        </th>
                        <td className="num">
                          {fmt(paying.single.quantity)}
                          <span className="hint block">
                            {paying.single.stacks!.stacks} stacks{paying.single.stacks!.rest ? ` + ${paying.single.stacks!.rest}` : ""}
                          </span>
                        </td>
                        <td>
                          <Money c={paying.single.quantity * prices.ecto} />
                        </td>
                      </tr>
                    )}
                    {kind === "mc" && (
                      <tr>
                        <th scope="row" className="l">
                          Mystic Coins
                        </th>
                        <td className="num">{fmt(paying.single.quantity)}</td>
                        <td>
                          <Money c={paying.single.quantity * prices.mc} />
                        </td>
                      </tr>
                    )}
                    {kind === "gold" && (
                      <tr>
                        <th scope="row" className="l">
                          Raw gold
                        </th>
                        <td />
                        <td>
                          <Money c={paying.single.quantity} />
                        </td>
                      </tr>
                    )}
                  </>
                )}
                {"mix" in paying && paying.mix && (
                  <>
                    {paying.mix.t6Sets > 0 && (
                      <tr className={filler === "t6" ? "filler" : ""}>
                        <th scope="row" className="l">
                          T6 sets
                        </th>
                        <td className="num">{fmt(paying.mix.t6Sets)}</td>
                        <td>
                          <Money c={paying.mix.t6Sets * prices.t6set} />
                        </td>
                      </tr>
                    )}
                    {paying.mix.ectoStacks > 0 && (
                      <tr className={filler === "ecto" ? "filler" : ""}>
                        <th scope="row" className="l">
                          Ecto stacks
                        </th>
                        <td className="num">
                          {fmt(paying.mix.ectoStacks)}
                          <span className="hint block">{fmt(paying.mix.ectoStacks * ECTO_STACK)} Ecto</span>
                        </td>
                        <td>
                          <Money c={paying.mix.ectoStacks * ECTO_STACK * prices.ecto} />
                        </td>
                      </tr>
                    )}
                    {paying.mix.mc > 0 && (
                      <tr className={filler === "mc" ? "filler" : ""}>
                        <th scope="row" className="l">
                          Mystic Coins
                        </th>
                        <td className="num">{fmt(paying.mix.mc)}</td>
                        <td>
                          <Money c={paying.mix.mc * prices.mc} />
                        </td>
                      </tr>
                    )}
                    {paying.mix.goldCopper > 0 && (
                      <tr className={filler === "gold" ? "filler" : ""}>
                        <th scope="row" className="l">
                          Raw gold
                        </th>
                        <td />
                        <td>
                          <Money c={paying.mix.goldCopper} />
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          )}
          {paying && "mix" in paying && paying.mix?.over && <p className="error">The amounts you entered already exceed what is owed.</p>}
          {paying && amount !== null && (
            <p className="hint">
              Owed {formatGold(amount)}. Each item is valued at its OTC price: Ecto <Money c={prices.ecto} />, MC <Money c={prices.mc} />, T6 set <Money c={prices.t6set} />. Rounded to the nearest whole unit; any difference is waived.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="mix">
            <Field id="r-ecto" label="Globs of Ectoplasm" hint={int(rEcto) >= ECTO_STACK ? `${Math.floor(int(rEcto) / ECTO_STACK)} stacks + ${int(rEcto) % ECTO_STACK}` : "units"}>
              <input id="r-ecto" inputMode="numeric" value={rEcto} onChange={(e) => setREcto(e.target.value)} placeholder="0" />
            </Field>
            <Field id="r-mc" label="Mystic Coins">
              <input id="r-mc" inputMode="numeric" value={rMc} onChange={(e) => setRMc(e.target.value)} placeholder="0" />
            </Field>
            <Field id="r-gold" label="Raw gold">
              <input id="r-gold" value={rGold} onChange={(e) => setRGold(e.target.value)} placeholder="0g" />
            </Field>
          </div>
          <table className="ledger result" aria-live="polite">
            <thead>
              <tr>
                <th className="l" scope="col">
                  You receive
                </th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {int(rEcto) > 0 && (
                <tr>
                  <th scope="row" className="l">
                    {fmt(int(rEcto))} Ecto
                  </th>
                  <td>
                    <Money c={int(rEcto) * prices.ecto} />
                  </td>
                </tr>
              )}
              {int(rMc) > 0 && (
                <tr>
                  <th scope="row" className="l">
                    {fmt(int(rMc))} Mystic Coins
                  </th>
                  <td>
                    <Money c={int(rMc) * prices.mc} />
                  </td>
                </tr>
              )}
              {(parseGold(rGold) ?? 0) > 0 && (
                <tr>
                  <th scope="row" className="l">
                    Raw gold
                  </th>
                  <td>
                    <Money c={parseGold(rGold)} />
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="l">
                  Total
                </th>
                <td>
                  <Money c={received} />
                </td>
              </tr>
            </tfoot>
          </table>
        </>
      )}
    </div>
  );
}
