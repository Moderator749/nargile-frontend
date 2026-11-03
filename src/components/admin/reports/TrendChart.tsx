"use client";

import { useState, type KeyboardEvent } from "react";

import { formatMoney } from "@/lib/format";
import { formatCount } from "@/lib/reportFormat";
import type { Granularity, TrendPoint } from "@/lib/reportsApi";

export type TrendMetric = "revenue" | "orders" | "average_order_value";

export const METRIC_LABELS: Record<TrendMetric, string> = {
  revenue: "Ciro",
  orders: "Sipariş",
  average_order_value: "Ortalama Sepet",
};

const TZ = "Europe/Istanbul";
const HOUR = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const DAY = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "numeric", month: "short" });
const FULL_DAY = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric", weekday: "long" });
const COMPACT = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });
const HEIGHT = 224;
const MAX_TICKS = 8;

function value(p: TrendPoint, metric: TrendMetric): number {
  return metric === "orders" ? p.orders : Number(p[metric]);
}

function show(v: number, metric: TrendMetric): string {
  return metric === "orders" ? formatCount(v) : formatMoney(v);
}

function tick(iso: string, unit: Granularity): string {
  return unit === "hour" ? HOUR.format(new Date(iso)) : DAY.format(new Date(iso));
}

function when(iso: string, unit: Granularity): string {
  const d = new Date(iso);
  if (unit === "hour") return `${FULL_DAY.format(d)}, ${HOUR.format(d)}`;
  return unit === "week" ? `${DAY.format(d)} haftası` : FULL_DAY.format(d);
}

/** A round top for the scale: 1, 2, 2.5 or 5 times a power of ten. */
function niceMax(max: number): number {
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  return ([1, 2, 2.5, 5, 10].find((m) => m * power >= max) ?? 10) * power;
}

/**
 * Bars, one per hour, day or week. Hover, or focus the chart and use the
 * arrow keys, to read a bar; the same figures are in a table for screen
 * readers. Plain SVG: nothing to download for a chart.
 */
export default function TrendChart({
  points,
  granularity,
  metric,
}: {
  points: TrendPoint[];
  granularity: Granularity;
  metric: TrendMetric;
}) {
  const [active, setActive] = useState<number | null>(null);
  const values = points.map((p) => value(p, metric));
  const top = niceMax(Math.max(0, ...values));
  const n = Math.max(points.length, 1);
  const every = Math.ceil(n / MAX_TICKS);
  const grid = [0, 0.25, 0.5, 0.75, 1];
  const shown = active !== null ? points[active] : null;

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    setActive((i) => {
      if (e.key === "Home") return 0;
      if (e.key === "End") return n - 1;
      const from = i ?? (e.key === "ArrowRight" ? -1 : n);
      return Math.min(n - 1, Math.max(0, from + (e.key === "ArrowRight" ? 1 : -1)));
    });
  }

  return (
    <div className="px-5 pb-5 pt-4">
      {/* The reading of the bar under the pointer; its height is kept so nothing moves. */}
      <p className="h-5 text-xs text-slate-600 dark:text-zinc-300" aria-live="polite">
        {shown ? (
          <>
            <span className="font-medium">{when(shown.start, granularity)}</span>
            {" · "}
            <span className="font-mono tabular-nums">{show(value(shown, metric), metric)}</span>
            {metric !== "orders" && <span className="text-slate-500 dark:text-zinc-400"> · {formatCount(shown.orders)} sipariş</span>}
          </>
        ) : (
          <span className="text-slate-400 dark:text-zinc-500">Bir çubuğun üzerine gelin.</span>
        )}
      </p>
      <div className="mt-2 flex gap-2">
        <div className="relative w-14 shrink-0 text-right font-mono text-[10px] text-slate-400 tabular-nums dark:text-zinc-500" style={{ height: HEIGHT }} aria-hidden>
          {grid.map((g) => (
            <span key={g} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - g) * 100}%` }}>
              {COMPACT.format(top * g)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div
            role="img"
            aria-label={`${METRIC_LABELS[metric]} grafiği, ${points.length} dönem. Ayrıntılar aşağıdaki tabloda.`}
            tabIndex={0}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
            onPointerLeave={() => setActive(null)}
            className="relative rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500"
            style={{ height: HEIGHT }}
          >
            <svg viewBox={`0 0 ${n} 100`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              {grid.map((g) => (
                <line
                  key={g}
                  x1={0}
                  x2={n}
                  y1={(1 - g) * 100}
                  y2={(1 - g) * 100}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-slate-200 dark:stroke-white/10"
                  strokeWidth={1}
                />
              ))}
              {values.map((v, i) => {
                const h = (v / top) * 100;
                return (
                  <g key={points[i].start} onPointerEnter={() => setActive(i)}>
                    {/* The whole column answers the pointer, not just the bar. */}
                    <rect x={i} y={0} width={1} height={100} fill="transparent" />
                    <rect
                      x={i + 0.15}
                      y={100 - h}
                      width={0.7}
                      height={h}
                      className={`transition-colors duration-150 ${
                        active === i ? "fill-red-600 dark:fill-red-400" : "fill-red-500/70 dark:fill-red-400/60"
                      }`}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="relative mt-1.5 h-4 font-mono text-[10px] text-slate-400 dark:text-zinc-500" aria-hidden>
            {points.map((p, i) =>
              i % every === 0 ? (
                <span key={p.start} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((i + 0.5) / n) * 100}%` }}>
                  {tick(p.start, granularity)}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{METRIC_LABELS[metric]}</caption>
        <thead>
          <tr>
            <th scope="col">Dönem</th>
            <th scope="col">Ciro</th>
            <th scope="col">Sipariş</th>
            <th scope="col">Ortalama Sepet</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.start}>
              <th scope="row">{when(p.start, granularity)}</th>
              <td>{formatMoney(p.revenue)}</td>
              <td>{formatCount(p.orders)}</td>
              <td>{formatMoney(p.average_order_value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
