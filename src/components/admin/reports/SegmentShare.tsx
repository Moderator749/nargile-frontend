import { formatMoney } from "@/lib/format";
import { DASH, formatCount, formatPercent } from "@/lib/reportFormat";
import type { SegmentRow } from "@/lib/reportsApi";
import type { SegmentType } from "@/types";

import { MarginBadge } from "./MarginBadge";

const COLOURS: Record<SegmentType, string> = {
  RETAIL: "bg-rose-500",
  CAFE: "bg-amber-400",
  WHOLESALE: "bg-sky-500",
  DEALER: "bg-violet-500",
};

/** Each customer group's share of the revenue, as one bar and as rows. */
export function SegmentShare({ rows, threshold }: { rows: SegmentRow[]; threshold: number }) {
  const any = rows.some((r) => Number(r.revenue) > 0);
  return (
    <div className="px-5 pb-5 pt-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5" aria-hidden>
        {any &&
          rows.map((r) => (
            <span
              key={r.segment}
              className={`${COLOURS[r.segment]} h-full transition-[width] duration-300 motion-reduce:transition-none`}
              style={{ width: `${Number(r.share_percent)}%` }}
            />
          ))}
      </div>
      <ul className="mt-4 divide-y divide-slate-100 dark:divide-white/5">
        {rows.map((r) => (
          <li key={r.segment} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${COLOURS[r.segment]}`} aria-hidden />
                <span className="truncate">{r.label}</span>
              </span>
              <span className="shrink-0 font-mono text-sm tabular-nums">{formatMoney(r.revenue)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 ps-[1.125rem] text-xs text-slate-500 dark:text-zinc-400">
              <span>
                <span className="font-mono tabular-nums">{formatPercent(r.share_percent)}</span> pay · {formatCount(r.orders)} sipariş
              </span>
              {r.margin_percent === null ? (
                <span className="text-slate-400 dark:text-zinc-500">{DASH}</span>
              ) : (
                <MarginBadge value={r.margin_percent} threshold={threshold} prefix="Marj" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
