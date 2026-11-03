import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, LifeBuoy, Minus } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { formatMoney } from "@/lib/format";
import { DASH, formatChange, formatCount, formatPercent, formatPoints, trendOf, type Trend } from "@/lib/reportFormat";
import type { ReportSummary } from "@/lib/reportsApi";
import { periodText } from "@/lib/reportFilters";

const TREND_STYLE: Record<Trend, string> = {
  up: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  down: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  flat: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-zinc-400",
};
const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const;

function Change({ text, trend }: { text: string | null; trend: Trend | null }) {
  if (!text || !trend) {
    return <span className="text-[11px] text-slate-400 dark:text-zinc-500">Karşılaştırma yok</span>;
  }
  const Icon = TREND_ICON[trend];
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${TREND_STYLE[trend]}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {text}
    </span>
  );
}

function Card({
  label,
  value,
  change,
  before,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  change: ReactNode;
  before: string;
  note?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:shadow-none"
          : `${panelClass} px-4 py-4`
      }
    >
      <dt className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${accent ? "text-emerald-800 dark:text-emerald-200" : "text-slate-500 dark:text-zinc-400"}`}>
        {accent && <LifeBuoy className="h-3.5 w-3.5" aria-hidden />}
        {label}
      </dt>
      <dd className="mt-2">
        <p className="truncate font-mono text-xl font-semibold tabular-nums" title={value}>
          {value}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {change}
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">önceki: {before}</span>
        </div>
        {note && <p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-zinc-400">{note}</p>}
      </dd>
    </div>
  );
}

/** The period at a glance, each figure against the same number of days before it. */
export function KpiCards({ summary }: { summary: ReportSummary | null }) {
  if (!summary) {
    return (
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6" aria-busy>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`${panelClass} h-[136px] motion-safe:animate-pulse`} />
        ))}
      </dl>
    );
  }
  const { current: now, previous: then, changes } = summary;
  const money = (v: string | null) => (v === null ? DASH : formatMoney(v));
  const costed = now.costed_share_percent;
  return (
    <>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <Card label="Ciro" value={money(now.revenue)} before={money(then.revenue)} change={<Change text={formatChange(changes.revenue)} trend={trendOf(changes.revenue)} />} />
        <Card label="Sipariş" value={formatCount(now.orders)} before={formatCount(then.orders)} change={<Change text={formatChange(changes.orders)} trend={trendOf(changes.orders)} />} />
        <Card
          label="Ortalama Sepet"
          value={money(now.average_order_value)}
          before={money(then.average_order_value)}
          change={<Change text={formatChange(changes.average_order_value)} trend={trendOf(changes.average_order_value)} />}
        />
        <Card
          label="Brüt Kâr"
          value={money(now.gross_profit)}
          before={money(then.gross_profit)}
          change={<Change text={formatChange(changes.gross_profit)} trend={trendOf(changes.gross_profit)} />}
          note={now.estimated_cost_lines > 0 ? `${formatCount(now.estimated_cost_lines)} satırda maliyet tahmini (bugünkü maliyet).` : undefined}
        />
        <Card
          label="Brüt Marj"
          value={formatPercent(now.margin_percent)}
          before={formatPercent(then.margin_percent)}
          change={<Change text={formatPoints(changes.margin_points)} trend={trendOf(changes.margin_points)} />}
          note={costed !== null && Number(costed) < 100 ? `KDV hariç cironun ${formatPercent(costed)} kadarı maliyetli satırlardan.` : undefined}
        />
        <Card
          accent
          label="Kurtarılan Ciro"
          value={money(now.recovered_revenue)}
          before={money(then.recovered_revenue)}
          change={<Change text={formatChange(changes.recovered_revenue)} trend={trendOf(changes.recovered_revenue)} />}
          note={`"Siparişi Kurtar" ile geri kazanılan ${formatCount(now.recovered_orders)} sipariş.`}
        />
      </dl>
      <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
        Önceki dönem: {periodText(summary.previous_period.date_from, summary.previous_period.date_to)}. Ciro: ödenmiş siparişler,
        ödeme tarihine göre; indirimler düşülmüş, KDV dahil, kargo hariç. Kâr ve marj KDV hariç.
      </p>
    </>
  );
}
