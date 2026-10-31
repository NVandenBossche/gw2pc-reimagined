import { useEffect, useState } from "react";

export type Route =
  | { name: "home" }
  | { name: "pay" }
  | { name: "leg" }
  | { name: "item"; slug: string }
  | { name: "set"; slug: string }
  | { name: "notfound" };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  const [a, b] = path.split("/");
  if (!a) return { name: "home" };
  if (a === "pay") return { name: "pay" };
  if (a === "leg") return { name: "leg" };
  if (a === "item" && b) return { name: "item", slug: b };
  if (a === "set" && b) return { name: "set", slug: b };
  return { name: "notfound" };
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
