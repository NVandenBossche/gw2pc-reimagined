import { useMemo } from "react";
import { average, change, daysOfHistory, type Point } from "../../core/trends";
import { Chart } from "./Chart";
import { Delta, Money } from "./Money";

export const MIN_TREND_DAYS = 7;

/** Series with the live OTC price appended, so changes are measured against "now". */
export function withLive(points: Point[] | undefined, live: number | undefined, nowMs: number): Point[] {
  const pts = points ? [...points] : [];
  if (live) pts.push({ t: Math.floor(nowMs / 1000), v: live });
  return pts;
}

export function trendStats(points: Point[], nowMs: number) {
  const now = Math.floor(nowMs / 1000);
  const latest = points[points.length - 1]?.v ?? null;
  const a7 = average(points, now, 7);
  const a30 = average(points, now, 30);
  return {
    days: daysOfHistory(points),
    d1: change(points, now, 1),
    d7: change(points, now, 7),
    d30: change(points, now, 30),
    avg7: a7,
    avg30: a30,
    vs7: latest !== null && a7 ? (latest - a7) / a7 : null,
    vs30: latest !== null && a30 ? (latest - a30) / a30 : null,
  };
}

export function Collecting({ days }: { days: number }) {
  return (
    <p className="muted">
      Collecting history: {days.toFixed(1)} of {MIN_TREND_DAYS} days. Trends appear once a week of Snapshots exists.
    </p>
  );
}

export function Trend({ name, points, loaded, now }: { name: string; points: Point[]; loaded: boolean; now: number }) {
  const s = useMemo(() => trendStats(points, now), [points, now]);
  if (!loaded) return <p className="muted">Loading history…</p>;
  const ready = s.days >= MIN_TREND_DAYS;
  return (
    <div className="trend">
      {ready ? (
        <dl className="facts">
          <div>
            <dt>24h</dt>
            <dd>
              <Delta v={s.d1} />
            </dd>
          </div>
          <div>
            <dt>7d</dt>
            <dd>
              <Delta v={s.d7} />
            </dd>
          </div>
          <div>
            <dt>30d</dt>
            <dd>
              <Delta v={s.d30} />
            </dd>
          </div>
          <div>
            <dt>vs 7d average</dt>
            <dd>
              <Delta v={s.vs7} /> <span className="muted">(avg </span>
              <Money c={s.avg7 === null ? null : Math.round(s.avg7)} />
              <span className="muted">)</span>
            </dd>
          </div>
          <div>
            <dt>vs 30d average</dt>
            <dd>
              <Delta v={s.vs30} />
            </dd>
          </div>
        </dl>
      ) : (
        <Collecting days={s.days} />
      )}
      {s.days >= 1 && <Chart ariaLabel={`${name} OTC price over time`} series={[{ label: name, points, tone: "a" }]} />}
    </div>
  );
}
