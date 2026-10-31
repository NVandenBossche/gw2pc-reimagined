import { useEffect, useState } from "react";
import { mergeSeries, type Series } from "../core/snapshots";
import type { Point } from "../core/trends";
import { DATA_BASE } from "./config";

async function getSeries(path: string): Promise<Series> {
  try {
    const r = await fetch(`${DATA_BASE}/${path}`);
    return r.ok ? ((await r.json()) as Series) : {};
  } catch {
    return {};
  }
}

const months = (n: number): string[] => {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)).toISOString().slice(0, 7));
  }
  return out;
};

export type History = { series: Record<string, Point[]>; loaded: boolean };

/** Tracked series: hourly for the last ~60 days plus the daily archive for this and last year. */
export function useHistory(kind: "tracked" | "legendaries"): History {
  const [state, setState] = useState<History>({ series: {}, loaded: false });
  useEffect(() => {
    let alive = true;
    (async () => {
      const ms = months(kind === "tracked" ? 3 : 14);
      const years = [...new Set(ms.map((m) => m.slice(0, 4)))];
      const parts =
        kind === "tracked"
          ? [...(await Promise.all(years.map((y) => getSeries(`snapshots/daily/${y}.json`)))), ...(await Promise.all(ms.map((m) => getSeries(`snapshots/hourly/${m}.json`))))]
          : await Promise.all(ms.map((m) => getSeries(`snapshots/legendaries/${m}.json`)));
      const merged = mergeSeries(...parts);
      const series: Record<string, Point[]> = {};
      for (const [k, pts] of Object.entries(merged)) series[k] = pts.map(([t, v]) => ({ t, v }));
      if (alive) setState({ series, loaded: true });
    })();
    return () => {
      alive = false;
    };
  }, [kind]);
  return state;
}
