import { useMemo } from "react";
import { ITEMS, SETS, itemBySlug, setBySlug } from "../../core/catalog";
import { economyIndex, type Point } from "../../core/trends";
import { Chart, Sparkline } from "../components/Chart";
import { Delta, Money } from "../components/Money";
import { PayCalculator } from "../components/PayCalculator";
import { Collecting, MIN_TREND_DAYS, trendStats, withLive } from "../components/Trend";
import { useHistory } from "../history";
import { useNow, usePrices } from "../prices";

type Row = { slug: string; label: string; basis: string; href?: string; stack?: boolean };

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

function basisOf(slug: string): string {
  const it = itemBySlug(slug);
  if (it) return `${it.standardRatio[1]}% ${cap(it.standardRatio[0])} @ ${it.standardDepth.toLocaleString("en")}`;
  const st = setBySlug(slug);
  if (st) return `${st.standardRatio[1]}% ${cap(st.standardRatio[0])} @ ${st.standardDepth}, 8 × 250`;
  return "400 gems, bought with gold";
}

const KEY: Row[] = [
  { slug: "mc", label: "Mystic Coin", basis: basisOf("mc"), href: "#/item/mc", stack: true },
  { slug: "ecto", label: "Glob of Ectoplasm", basis: basisOf("ecto"), href: "#/item/ecto", stack: true },
  { slug: "t6", label: "T6 set", basis: basisOf("t6"), href: "#/set/t6" },
  { slug: "gem", label: "Gem price", basis: basisOf("gem") },
];

function rebase(points: Point[], t0: number): Point[] {
  const from = points.filter((p) => p.t >= t0);
  const base = from[0]?.v;
  return base ? from.map((p) => ({ t: p.t, v: (p.v / base) * 100 })) : [];
}

export function Home() {
  const { tracked } = usePrices();
  const { series, loaded } = useHistory("tracked");
  const now = useNow();

  const live = useMemo(() => {
    const out: Record<string, Point[]> = {};
    for (const k of Object.keys(tracked)) out[k] = withLive(series[k], tracked[k], now);
    return out;
  }, [series, tracked, now]);

  const index = useMemo(() => {
    const parts = ["mc", "ecto", "t6"].map((k) => series[k] ?? []);
    const idx = economyIndex(parts);
    const gem = idx.length ? rebase(series.gem ?? [], idx[0]!.t) : [];
    return { idx, gem, days: idx.length > 1 ? (idx[idx.length - 1]!.t - idx[0]!.t) / 86400 : 0 };
  }, [series]);

  const rest = [
    ...ITEMS.filter((i) => i.slug !== "mc" && i.slug !== "ecto").map((i) => ({ slug: i.slug, label: i.name, basis: basisOf(i.slug), href: `#/item/${i.slug}` })),
    ...SETS.filter((s) => s.slug !== "t6").map((s) => ({ slug: s.slug, label: s.name, basis: basisOf(s.slug), href: `#/set/${s.slug}` })),
  ];

  return (
    <>
      <section aria-labelledby="key">
        <h1 id="key">Key prices</h1>
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th className="l" scope="col">
                  Item
                </th>
                <th scope="col">OTC price</th>
                <th scope="col" className="hide-s">
                  Per stack
                </th>
                <th scope="col">24h</th>
                <th scope="col">7d</th>
                <th scope="col" className="hide-s">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {KEY.map((r) => {
                const s = trendStats(live[r.slug] ?? [], now);
                const ready = s.days >= MIN_TREND_DAYS;
                return (
                  <tr key={r.slug}>
                    <th scope="row" className="l">
                      {r.href ? <a href={r.href}>{r.label}</a> : r.label}
                      <span className="basis">{r.basis}</span>
                    </th>
                    <td className="otc">
                      <Money c={tracked[r.slug]} />
                    </td>
                    <td className="hide-s">{r.stack && tracked[r.slug] ? <Money c={tracked[r.slug]! * 250} /> : <span className="muted">–</span>}</td>
                    <td>{ready ? <Delta v={s.d1} /> : <span className="muted">–</span>}</td>
                    <td>{ready ? <Delta v={s.d7} /> : <span className="muted">–</span>}</td>
                    <td className="hide-s">{ready ? <Sparkline points={(live[r.slug] ?? []).filter((p) => p.t >= now / 1000 - 30 * 86400)} /> : <span className="muted">–</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {loaded && Math.max(...KEY.map((k) => trendStats(live[k.slug] ?? [], now).days)) < MIN_TREND_DAYS && (
          <Collecting days={Math.max(0, ...KEY.map((k) => trendStats(live[k.slug] ?? [], now).days))} />
        )}
      </section>

      <section aria-labelledby="pay">
        <h2 id="pay">
          <a className="plain" href="#/pay">
            Payment calculator
          </a>
        </h2>
        <PayCalculator />
      </section>

      <section aria-labelledby="eco">
        <h2 id="eco">Economy index</h2>
        <p className="hint">
          MC, Ecto and T6 set OTC prices, equally weighted, 100 at the first Snapshot. The gem line is the Gem price on the same base (not part of the index).
        </p>
        {!loaded ? (
          <p className="muted">Loading history…</p>
        ) : index.days < 1 ? (
          <Collecting days={index.days} />
        ) : (
          <Chart
            ariaLabel="Economy index and gem price, base 100"
            format={(v) => v.toFixed(1)}
            series={[
              { label: "Economy index", points: index.idx, tone: "a" },
              ...(index.gem.length > 1 ? [{ label: "Gem price", points: index.gem, tone: "b" as const }] : []),
            ]}
          />
        )}
        {loaded && index.days >= 1 && index.days < MIN_TREND_DAYS && <Collecting days={index.days} />}
      </section>

      <section aria-labelledby="all">
        <h2 id="all">All prices</h2>
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th className="l" scope="col">
                  Item
                </th>
                <th scope="col">OTC price</th>
                <th scope="col">7d</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((r) => {
                const s = trendStats(live[r.slug] ?? [], now);
                return (
                  <tr key={r.slug}>
                    <th scope="row" className="l">
                      <a href={r.href}>{r.label}</a>
                      <span className="basis">{r.basis}</span>
                    </th>
                    <td className="otc-soft">
                      <Money c={tracked[r.slug]} />
                    </td>
                    <td>{s.days >= MIN_TREND_DAYS ? <Delta v={s.d7} /> : <span className="muted">–</span>}</td>
                  </tr>
                );
              })}
              <tr>
                <th scope="row" className="l">
                  <a href="#/leg">Legendary weapons</a>
                  <span className="basis">Gen 1, Gen 3 and others, 85% Sell</span>
                </th>
                <td colSpan={2} className="muted">
                  see page
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
