import { useEffect, useState } from "react";
import { formatGoldSilver, parseGold } from "../core/money";

export type Route =
  | { name: "home" }
  | { name: "pay"; amount?: string }
  | { name: "leg" }
  | { name: "item"; slug: string }
  | { name: "set"; slug: string }
  | { name: "notfound" };

export function parseHash(hash: string): Route {
  const body = hash.replace(/^#\/?/, "");
  const q = body.indexOf("?");
  const rawPath = q < 0 ? body : body.slice(0, q);
  const query = q < 0 ? "" : body.slice(q + 1);
  const path = rawPath.replace(/\/+$/, "");
  const [a, b] = path.split("/");
  if (!a) return { name: "home" };
  if (a === "pay") {
    const amount = new URLSearchParams(query).get("amount");
    return amount !== null && parseGold(amount) !== null ? { name: "pay", amount } : { name: "pay" };
  }
  if (a === "leg") return { name: "leg" };
  if (a === "item" && b) return { name: "item", slug: b };
  if (a === "set" && b) return { name: "set", slug: b };
  return { name: "notfound" };
}

/** Pay link carrying an amount (copper) as displayed on a gold/silver price cell. */
export function payLink(copper: number): string {
  return `#/pay?amount=${encodeURIComponent(formatGoldSilver(copper))}`;
}

/** Pay link for a price cell, or null when there is no usable price (missing, zero or under half a silver). */
export function payHref(copper: number | null | undefined): string | null {
  if (copper === null || copper === undefined || !Number.isFinite(copper) || Math.round(copper / 100) <= 0) return null;
  return payLink(copper);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
