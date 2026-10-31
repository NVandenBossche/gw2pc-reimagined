export type SeriesPoint = [t: number, v: number]; // unix seconds, copper
export type Series = Record<string, SeriesPoint[]>;

export const HOURLY_KEEP_DAYS = 30;
const DAY = 86400;

export const dayKey = (t: number) => Math.floor(t / DAY);
export const monthKey = (t: number) => new Date(t * 1000).toISOString().slice(0, 7);
export const yearKey = (t: number) => new Date(t * 1000).toISOString().slice(0, 4);

/** Keep the last point of each UTC day. */
export function collapseToDaily(points: SeriesPoint[]): SeriesPoint[] {
  const byDay = new Map<number, SeriesPoint>();
  for (const p of [...points].sort((a, b) => a[0] - b[0])) byDay.set(dayKey(p[0]), p);
  return [...byDay.values()];
}

/** Merge several point lists: sorted by time, one point per timestamp (later list wins). */
export function mergePoints(...lists: SeriesPoint[][]): SeriesPoint[] {
  const byT = new Map<number, SeriesPoint>();
  for (const list of lists) for (const p of list) byT.set(p[0], p);
  return [...byT.values()].sort((a, b) => a[0] - b[0]);
}

export function mergeSeries(...parts: Series[]): Series {
  const keys = new Set(parts.flatMap((p) => Object.keys(p)));
  const out: Series = {};
  for (const k of keys) out[k] = mergePoints(...parts.map((p) => p[k] ?? []));
  return out;
}

export function appendPoint(series: Series, key: string, t: number, v: number): void {
  (series[key] ??= []).push([t, v]);
}

/**
 * Move hourly points older than `keepDays` into the daily store, one per UTC day.
 * `hourly` is keyed by "YYYY-MM", `daily` by "YYYY". Months/years that end up empty are dropped.
 */
export function thin(
  hourly: Record<string, Series>,
  daily: Record<string, Series>,
  now: number,
  keepDays = HOURLY_KEEP_DAYS,
): { hourly: Record<string, Series>; daily: Record<string, Series> } {
  const cutoff = now - keepDays * DAY;
  const newHourly: Record<string, Series> = {};
  const newDaily: Record<string, Series> = structuredClone(daily);

  for (const [month, series] of Object.entries(hourly)) {
    const kept: Series = {};
    for (const [key, points] of Object.entries(series)) {
      const old = points.filter((p) => p[0] < cutoff);
      const recent = points.filter((p) => p[0] >= cutoff);
      if (recent.length) kept[key] = recent;
      for (const p of collapseToDaily(old)) {
        const y = yearKey(p[0]);
        const target = ((newDaily[y] ??= {})[key] ??= []);
        // A day already stored keeps the newer point.
        const existing = target.findIndex((q) => dayKey(q[0]) === dayKey(p[0]));
        if (existing >= 0) target[existing] = p;
        else target.push(p);
        target.sort((a, b) => a[0] - b[0]);
      }
    }
    if (Object.keys(kept).length) newHourly[month] = kept;
  }
  return { hourly: newHourly, daily: newDaily };
}
