import { useEffect, useMemo, useState } from "react";
import { fetchItems, type ItemInfo } from "../../core/api";
import { itemBySlug, setBySlug } from "../../core/catalog";
import { itemRows, setRows } from "../../core/compute";
import { depthPrice } from "../../core/depth";
import { otcPrice } from "../../core/otc";
import { Money } from "../components/Money";
import { PriceTable } from "../components/PriceTable";
import { Trend, withLive } from "../components/Trend";
import { bltc } from "../config";
import { useHistory } from "../history";
import { useNow, usePrices } from "../prices";

function useTitle(t: string) {
  useEffect(() => {
    document.title = `${t} · GW2PC Reimagined`;
  }, [t]);
}

function useItemInfo(id: number | undefined) {
  const [info, setInfo] = useState<ItemInfo | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetchItems([id])
      .then((m) => alive && setInfo(m.get(id) ?? null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);
  return info;
}

export function ItemPage({ slug }: { slug: string }) {
  const item = itemBySlug(slug);
  const { books, tracked } = usePrices();
  const { series, loaded } = useHistory("tracked");
  const now = useNow();
  const info = useItemInfo(item?.id);
  useTitle(item?.name ?? "Not found");
  const rows = useMemo(() => (item ? itemRows(item, books) : null), [item, books]);
  if (!item) return <p>No such item.</p>;
  const price = rows ? otcPrice(rows, item.standardDepth, item.standardRatio) : null;
  const [side, pct] = item.standardRatio;

  return (
    <>
      <h1 className="with-icon">
        {info?.icon && <img src={info.icon} alt="" width="32" height="32" />}
        <a className="plain" href={bltc(item.id)}>
          {item.name}
        </a>
      </h1>
      <dl className="facts answer">
        <div>
          <dt>OTC price</dt>
          <dd className="otc-big">
            <Money c={price === null ? null : Math.trunc(price)} />
          </dd>
        </div>
        <div>
          <dt>Per stack of 250</dt>
          <dd>
            <Money c={price === null ? null : Math.trunc(price * 250)} />
          </dd>
        </div>
        <div>
          <dt>Basis</dt>
          <dd>
            {pct}% {side === "sell" ? "Sell" : "Buy"} at depth {item.standardDepth.toLocaleString("en")}
          </dd>
        </div>
      </dl>
      {rows ? <PriceTable rows={rows} standardDepth={item.standardDepth} standardRatio={item.standardRatio} stack={250} /> : <p className="muted">Loading prices…</p>}
      <ul className="notes">
        <li>A buyer pays 100% Buy to place a buy order and wait, or 100% Sell to buy instantly.</li>
        <li>A seller receives 85% Sell after Trading Post fees if they list and wait.</li>
        <li>Between players, 90% Sell is the usual middle ground.</li>
        <li>Flip ROI shows when 100% Buy is below 85% Sell at that depth: buy with an order, relist, keep the difference.</li>
      </ul>
      <h2>Trend</h2>
      <Trend name={item.name} points={withLive(series[slug], tracked[slug], now)} loaded={loaded} now={now} />
    </>
  );
}

export function SetPage({ slug }: { slug: string }) {
  const set = setBySlug(slug);
  const { books, tracked } = usePrices();
  const { series, loaded } = useHistory("tracked");
  const now = useNow();
  useTitle(set?.name ?? "Not found");
  const rows = useMemo(() => (set ? setRows(set, books) : null), [set, books]);
  if (!set) return <p>No such set.</p>;
  const price = rows ? otcPrice(rows, set.standardDepth, set.standardRatio) : null;
  const [side, pct] = set.standardRatio;

  return (
    <>
      <h1>{set.name}</h1>
      <dl className="facts answer">
        <div>
          <dt>OTC price</dt>
          <dd className="otc-big">
            <Money c={price === null ? null : Math.trunc(price)} />
          </dd>
        </div>
        <div>
          <dt>Basis</dt>
          <dd>
            {pct}% {side === "sell" ? "Sell" : "Buy"} at depth {set.standardDepth}, one stack of 250 of each of the 8 T{set.tier} materials
          </dd>
        </div>
      </dl>
      {rows ? <PriceTable rows={rows} standardDepth={set.standardDepth} standardRatio={set.standardRatio} /> : <p className="muted">Loading prices…</p>}

      <h2>Materials</h2>
      <p className="hint">100% Sell price of one unit at each depth.</p>
      <div className="table-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <th className="l" scope="col">
                Material
              </th>
              {set.depths.map((d) => (
                <th key={d} scope="col" className={d === set.standardDepth ? "std-col" : ""}>
                  Depth {d.toLocaleString("en")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {set.materials.map((m) => {
              const b = books.get(m.id);
              return (
                <tr key={m.id}>
                  <th scope="row" className="l">
                    <a href={bltc(m.id)}>{m.name}</a>
                  </th>
                  {set.depths.map((d) => (
                    <td key={d} className={d === set.standardDepth ? "otc-soft" : ""}>
                      <Money c={b ? depthPrice(b, "sell", d) : null} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2>Trend</h2>
      <Trend name={set.name} points={withLive(series[slug], tracked[slug], now)} loaded={loaded} now={now} />
    </>
  );
}
