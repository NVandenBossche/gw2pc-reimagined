import { Fragment, useEffect, useMemo, useState } from "react";
import { fetchBooks } from "../../core/api";
import type { LegendaryEntry } from "../../core/catalog";
import type { Books } from "../../core/compute";
import { LEG_DEPTHS, legendaryRow } from "../../core/legendary";
import { roiLevel } from "../../core/otc";
import { Delta, Money } from "../components/Money";
import { Trend, withLive } from "../components/Trend";
import { DATA_BASE, bltc } from "../config";
import { useHistory } from "../history";
import { useNow, usePrices } from "../prices";

type Sort = "name" | "price" | "roi";
const GROUPS: { gen: LegendaryEntry["gen"]; title: string }[] = [
  { gen: 1, title: "Gen 1" },
  { gen: 3, title: "Gen 3 (Aurene's)" },
  { gen: "other", title: "Other" },
];

export function Legendaries() {
  const { updatedAt } = usePrices();
  const { series, loaded } = useHistory("legendaries");
  const now = useNow();
  const [list, setList] = useState<LegendaryEntry[] | null>(null);
  const [books, setBooks] = useState<Books>(new Map());
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("name");

  useEffect(() => {
    document.title = "Legendaries · GW2PC Reimagined";
    fetch(`${DATA_BASE}/legendaries.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: LegendaryEntry[]) => setList(d))
      .catch(() => setFailed(true));
  }, []);

  // Re-read the order books whenever the global refresh cycle ticks.
  useEffect(() => {
    if (!list) return;
    fetchBooks(list.map((l) => l.id))
      .then(setBooks)
      .catch(() => setFailed(true));
  }, [list, updatedAt]);

  const rows = useMemo(() => {
    return (list ?? []).map((l) => {
      const book = books.get(l.id);
      const r = book ? legendaryRow(book) : null;
      const d = r?.standardDepth ?? 1;
      const buy = r?.buy[d] ?? null;
      const otc = r?.otc ?? null;
      const roi = buy && otc && buy < otc ? (otc - buy) / buy : null;
      return { l, r, d, buy, otc, raw: r?.rawSell[d] ?? null, roi };
    });
  }, [list, books]);

  const sorted = (gen: LegendaryEntry["gen"]) => {
    const g = rows.filter((x) => x.l.gen === gen);
    return g.sort((a, b) =>
      sort === "price" ? (b.otc ?? -1) - (a.otc ?? -1) : sort === "roi" ? (b.roi ?? -1) - (a.roi ?? -1) : a.l.name.localeCompare(b.l.name),
    );
  };

  if (failed && !list) return <p className="error">Could not load the legendary list.</p>;
  if (!list) return <p className="muted">Loading legendaries…</p>;

  return (
    <>
      <h1>Legendaries</h1>
      <p className="hint">
        OTC price is 85% Sell at the item's standard depth: depth 1, moving to 2 and then 3 only while each step adds more than 45g. Rounded to the silver.
      </p>
      <div className="seg" role="group" aria-label="Sort by">
        {(["name", "price", "roi"] as Sort[]).map((s) => (
          <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}>
            {s === "name" ? "Name" : s === "price" ? "Price" : "Flip ROI"}
          </button>
        ))}
      </div>

      {GROUPS.map((g) => {
        const group = sorted(g.gen);
        if (!group.length) return null;
        return (
          <section key={String(g.gen)} aria-label={g.title}>
            <h2>{g.title}</h2>
            <div className="table-wrap">
              <table className="ledger">
                <thead>
                  <tr>
                    <th className="l" scope="col">
                      Item
                    </th>
                    <th scope="col" className="hide-s">
                      Depth
                    </th>
                    <th scope="col">100% Buy</th>
                    <th scope="col" className="std-col">
                      85% Sell
                    </th>
                    <th scope="col" className="hide-s">
                      100% Sell
                    </th>
                    <th scope="col">Flip ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map(({ l, r, d, buy, otc, raw, roi }) => (
                    <Fragment key={l.id}>
                      <tr>
                        <th scope="row" className="l">
                          <button type="button" className="row-toggle" aria-expanded={open === l.id} onClick={() => setOpen(open === l.id ? null : l.id)}>
                            {l.name}
                          </button>
                        </th>
                        <td className="num muted hide-s">@{d}</td>
                        <td>
                          <Money c={buy} gs />
                        </td>
                        <td className="otc">
                          <Money c={otc} gs />
                        </td>
                        <td className="hide-s">
                          <Money c={raw} gs />
                        </td>
                        <td className={`roi roi-${roiLevel(roi)}`}>{roi === null ? <span className="muted">–</span> : <Delta v={roi} />}</td>
                      </tr>
                      {open === l.id && r && (
                        <tr className="detail">
                          <td colSpan={6}>
                            <div className="table-wrap">
                              <table className="ledger inner">
                                <thead>
                                  <tr>
                                    <th className="l" scope="col">
                                      Depth
                                    </th>
                                    <th scope="col">100% Buy</th>
                                    <th scope="col">85% Sell</th>
                                    <th scope="col">Flip ROI</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {LEG_DEPTHS.map((dep) => {
                                    const b = r.buy[dep] ?? null;
                                    const s = r.sell[dep] ?? null;
                                    const rr = b && s && b < s ? (s - b) / b : null;
                                    return (
                                      <tr key={dep} className={dep === d ? "std-row" : ""}>
                                        <th scope="row" className="l num">
                                          {dep}
                                        </th>
                                        <td>
                                          <Money c={b} gs />
                                        </td>
                                        <td className={dep === d ? "otc" : ""}>
                                          <Money c={s} gs />
                                        </td>
                                        <td className={`roi roi-${roiLevel(rr)}`}>{rr === null ? <span className="muted">–</span> : <Delta v={rr} />}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <p className="hint">
                              <a href={bltc(l.id)}>{l.name} on GW2BLTC</a>
                            </p>
                            <Trend name={l.name} points={withLive(series[String(l.id)], otc ?? undefined, now)} loaded={loaded} now={now} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </>
  );
}
