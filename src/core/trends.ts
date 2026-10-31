export type Point = { t: number; v: number }; // unix seconds, copper

const DAY = 86400;

/** Average of points in the last `days` days; null when there are none. */
export function average(points: Point[], now: number, days: number): number | null {
  const from = now - days * DAY;
  const win = points.filter((p) => p.t >= from);
  return win.length ? win.reduce((s, p) => s + p.v, 0) / win.length : null;
}

/** Fractional change against the point closest to (now − days), within 20% of the window. */
export function change(points: Point[], now: number, days: number): number | null {
  if (!points.length) return null;
  const target = now - days * DAY;
  const latest = points[points.length - 1]!;
  let best: Point | null = null;
  for (const p of points) if (!best || Math.abs(p.t - target) < Math.abs(best.t - target)) best = p;
  if (!best || best === latest || Math.abs(best.t - target) > days * DAY * 0.2 || best.v === 0) return null;
  return (latest.v - best.v) / best.v;
}

export function daysOfHistory(points: Point[]): number {
  if (points.length < 2) return 0;
  return (points[points.length - 1]!.t - points[0]!.t) / DAY;
}

/** Equal-weight index of several series, 100 at the first timestamp every series has data for. */
export function economyIndex(series: Point[][]): Point[] {
  if (!series.length || series.some((s) => !s.length)) return [];
  const maps = series.map((s) => new Map(s.map((p) => [p.t, p.v])));
  const times = [...maps[0]!.keys()].filter((t) => maps.every((m) => m.has(t))).sort((a, b) => a - b);
  if (!times.length) return [];
  const base = maps.map((m) => m.get(times[0]!)!);
  return times.map((t) => ({
    t,
    v: (maps.reduce((s, m, i) => s + m.get(t)! / base[i]!, 0) / maps.length) * 100,
  }));
}
