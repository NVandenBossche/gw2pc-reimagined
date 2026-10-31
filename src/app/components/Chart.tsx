import { useId, useMemo, useState } from "react";
import { formatGoldSilver } from "../../core/money";
import type { Point } from "../../core/trends";

export type ChartSeries = { label: string; points: Point[]; tone: "a" | "b" };

type Props = {
  series: ChartSeries[];
  height?: number;
  /** y-axis / readout formatter */
  format?: (v: number) => string;
  ariaLabel: string;
};

const W = 640;
const PAD = { l: 8, r: 8, t: 8, b: 20 };

const dateLabel = (t: number) => new Date(t * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function Chart({ series, height = 180, format = (v) => formatGoldSilver(v), ariaLabel }: Props) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap((s) => s.points);
  const geo = useMemo(() => {
    if (all.length < 2) return null;
    const t0 = Math.min(...all.map((p) => p.t));
    const t1 = Math.max(...all.map((p) => p.t));
    let lo = Math.min(...all.map((p) => p.v));
    let hi = Math.max(...all.map((p) => p.v));
    if (hi === lo) {
      hi += 1;
      lo -= 1;
    }
    const pad = (hi - lo) * 0.08;
    lo -= pad;
    hi += pad;
    const x = (t: number) => PAD.l + ((t - t0) / (t1 - t0 || 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (height - PAD.t - PAD.b);
    return { t0, t1, lo, hi, x, y };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, height]);

  if (!geo) return <p className="muted">Not enough history to draw a chart yet.</p>;

  const ref = series[0]!.points;
  const nearest = hover === null ? null : ref.reduce((best, p) => (Math.abs(p.t - hover) < Math.abs(best.t - hover) ? p : best), ref[0]!);
  const grid = [0, 0.5, 1].map((f) => geo.lo + (geo.hi - geo.lo) * f);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(geo.t0 + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (geo.t1 - geo.t0));
  };

  return (
    <figure className="chart">
      <figcaption className="chart-readout" aria-live="polite">
        {nearest ? (
          <>
            <span className="muted">{dateLabel(nearest.t)}</span>
            {series.map((s) => {
              const p = s.points.reduce((b, q) => (Math.abs(q.t - nearest.t) < Math.abs(b.t - nearest.t) ? q : b), s.points[0]!);
              return (
                <span key={s.label} className={`key key-${s.tone}`}>
                  {s.label} <b className="num">{format(p.v)}</b>
                </span>
              );
            })}
          </>
        ) : (
          series.map((s) => (
            <span key={s.label} className={`key key-${s.tone}`}>
              {s.label}
            </span>
          ))
        )}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        preserveAspectRatio="none"
        style={{ height }}
      >
        <title id={id}>{ariaLabel}</title>
        {grid.map((g) => (
          <g key={g}>
            <line className="grid" x1={PAD.l} x2={W - PAD.r} y1={geo.y(g)} y2={geo.y(g)} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {series.map((s) => (
          <polyline
            key={s.label}
            className={`line line-${s.tone}`}
            fill="none"
            vectorEffect="non-scaling-stroke"
            points={s.points.map((p) => `${geo.x(p.t).toFixed(1)},${geo.y(p.v).toFixed(1)}`).join(" ")}
          />
        ))}
        {nearest && <line className="cursor" x1={geo.x(nearest.t)} x2={geo.x(nearest.t)} y1={PAD.t} y2={height - PAD.b} vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="chart-axis">
        <span>{dateLabel(geo.t0)}</span>
        <span className="num">
          {format(geo.lo)} – {format(geo.hi)}
        </span>
        <span>{dateLabel(geo.t1)}</span>
      </div>
    </figure>
  );
}

export function Sparkline({ points }: { points: Point[] }) {
  if (points.length < 2) return <span className="muted">–</span>;
  const w = 72;
  const h = 20;
  const t0 = points[0]!.t;
  const t1 = points[points.length - 1]!.t;
  const lo = Math.min(...points.map((p) => p.v));
  const hi = Math.max(...points.map((p) => p.v));
  const d = points
    .map((p) => `${(((p.t - t0) / (t1 - t0 || 1)) * w).toFixed(1)},${(h - 2 - ((p.v - lo) / (hi - lo || 1)) * (h - 4)).toFixed(1)}`)
    .join(" ");
  const up = points[points.length - 1]!.v >= points[0]!.v;
  return (
    <svg className={`spark ${up ? "pos" : "neg"}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline fill="none" points={d} />
    </svg>
  );
}
