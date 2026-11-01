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
  const [rawPath = "", query = ""] = hash.replace(/^#\/?/, "").split("?", 2);
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
