import type { ReactNode } from "react";
import { ITEMS, SETS } from "../../core/catalog";
import { REPO_URL } from "../config";
import { useNow, usePrices } from "../prices";
import type { Route } from "../router";

const SHORT: Record<string, string> = { mc: "MC", ecto: "Ecto", t6: "T6", t5: "T5", matrix: "Matrix", encryption: "Encryption", ass: "ASS", ambergris: "Ambergris", runestone: "Runestone", gemstone: "Gemstone", lodestone: "Lodestone" };

const NAV: { label: string; href: string; active: (r: Route) => boolean }[] = [
  { label: "Home", href: "#/", active: (r) => r.name === "home" },
  { label: "Pay", href: "#/pay", active: (r) => r.name === "pay" },
  ...["mc", "ecto"].map((slug) => ({ label: SHORT[slug]!, href: `#/item/${slug}`, active: (r: Route) => r.name === "item" && r.slug === slug })),
  { label: "T6", href: "#/set/t6", active: (r) => r.name === "set" && r.slug === "t6" },
  { label: "T5", href: "#/set/t5", active: (r) => r.name === "set" && r.slug === "t5" },
  ...ITEMS.filter((i) => i.slug !== "mc" && i.slug !== "ecto").map((i) => ({ label: SHORT[i.slug] ?? i.name, href: `#/item/${i.slug}`, active: (r: Route) => r.name === "item" && r.slug === i.slug })),
  { label: "Legendaries", href: "#/leg", active: (r) => r.name === "leg" },
];
void SETS;

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg className={spinning ? "spin" : ""} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
      <path d="M13.5 2.5v3h-3" />
    </svg>
  );
}

export function Status() {
  const { updatedAt, loading, error, refresh } = usePrices();
  const now = useNow();
  const mins = updatedAt ? Math.max(0, Math.floor((now - updatedAt) / 60000)) : null;
  return (
    <div className="status" role="status">
      <span className={error ? "neg" : "muted"}>
        {error ? "Offline, showing last prices" : mins === null ? "Loading prices…" : mins === 0 ? "Updated just now" : `Updated ${mins} min ago`}
      </span>
      <button type="button" className="icon-btn" onClick={refresh} disabled={loading} aria-label="Refresh prices">
        <RefreshIcon spinning={loading} />
      </button>
    </div>
  );
}

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <>
      <header className="top">
        <div className="bar">
          <a className="brand" href="#/">
            GW2PC <span>Reimagined</span>
          </a>
          <Status />
        </div>
        <nav aria-label="Pages" className="nav">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} aria-current={n.active(route) ? "page" : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="foot">
        <p>
          Prices come live from the official Guild Wars 2 API. OTC prices follow the rules of{" "}
          <a href="https://gw2pc.com">gw2pc.com</a>, created by Cirdan (
          <a href="https://github.com/otc-cirdan/gw2pc">otc-cirdan/gw2pc</a>, GPLv3). This rebuild is GPLv3 too:{" "}
          <a href={REPO_URL}>source</a>.
        </p>
      </footer>
    </>
  );
}
