"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CreditCard, Landmark } from "lucide-react";

import { formatDate, formatMoney } from "@/lib/format";
import { apiParams, type ReportFilters } from "@/lib/reportFilters";
import { DASH, formatCount, formatPercent } from "@/lib/reportFormat";
import {
  reportPaymentMethods,
  reportSegments,
  reportSlowMovers,
  reportTop,
  reportTrend,
  type PaymentMethodRow,
  type SlowMoverRow,
  type TopBy,
  type TopRow,
  type TopSort,
} from "@/lib/reportsApi";

import { DataTable, Figure, ProductCell, type Column } from "./DataTable";
import { ExportButton } from "./ExportButton";
import { ReportPanel } from "./ReportPanel";
import { Segmented } from "./Segmented";
import { SegmentShare } from "./SegmentShare";
import { METRIC_LABELS, type TrendMetric } from "./TrendChart";
import { useReport } from "./useReport";

/** The chart's own height, kept by its placeholder so the page never shifts. */
function ChartPlaceholder() {
  return (
    <div className="px-5 pb-5 pt-4">
      <div className="h-[274px] rounded-lg bg-slate-50 motion-safe:animate-pulse dark:bg-white/[0.03]" />
    </div>
  );
}

const TrendChart = dynamic(() => import("./TrendChart"), { ssr: false, loading: ChartPlaceholder });

const GRANULARITY_TEXT = { hour: "saat saat", day: "gün gün", week: "hafta hafta" } as const;
const METRICS = (Object.keys(METRIC_LABELS) as TrendMetric[]).map((value) => ({ value, label: METRIC_LABELS[value] }));
const TOP_BY: { value: TopBy; label: string }[] = [
  { value: "product", label: "Ürün" },
  { value: "category", label: "Kategori" },
  { value: "brand", label: "Marka" },
];
const TOP_SORT: { value: TopSort; label: string }[] = [
  { value: "revenue", label: "Ciroya göre" },
  { value: "quantity", label: "Adede göre" },
];
const DAYS = [
  { value: "60", label: "60 gün" },
  { value: "90", label: "90 gün" },
] as const;

function TrendPanel({ base }: { base: Record<string, string | number> }) {
  const [metric, setMetric] = useState<TrendMetric>("revenue");
  const { data, error } = useReport(`trend|${JSON.stringify(base)}`, (signal) => reportTrend(base, signal));
  return (
    <ReportPanel
      id="trend"
      title="Satış Trendi"
      description={data ? `Ciro, sipariş ve ortalama sepet, ${GRANULARITY_TEXT[data.granularity]}.` : "Ciro, sipariş ve ortalama sepet."}
      controls={<Segmented label="Gösterilen" value={metric} options={METRICS} onChange={setMetric} />}
      actions={<ExportButton report="trend" params={base} />}
      error={error}
    >
      {data ? <TrendChart points={data.points} granularity={data.granularity} metric={metric} /> : <ChartPlaceholder />}
    </ReportPanel>
  );
}

function SegmentsPanel({ base, threshold }: { base: Record<string, string | number>; threshold: number }) {
  const { data, error } = useReport(`segments|${JSON.stringify(base)}`, (signal) => reportSegments(base, signal));
  return (
    <ReportPanel
      id="segments"
      title="Müşteri Grupları"
      description="Cironun Perakende, Kafe, Toptan ve Bayi arasındaki dağılımı; marj KDV hariç."
      actions={<ExportButton report="segments" params={base} />}
      error={error}
    >
      {data ? (
        <SegmentShare rows={data} threshold={threshold} />
      ) : (
        <div className="px-5 pb-5 pt-4">
          <div className="h-[212px] rounded-lg bg-slate-50 motion-safe:animate-pulse dark:bg-white/[0.03]" />
        </div>
      )}
    </ReportPanel>
  );
}

const METHOD = {
  CREDIT_CARD: { label: "Kredi Kartı", Icon: CreditCard },
  BANK_TRANSFER: { label: "Havale/EFT", Icon: Landmark },
} as const;

function MethodCard({ row }: { row: PaymentMethodRow }) {
  const { label, Icon } = METHOD[row.payment_method];
  const counts: [string, number][] = [
    ["Verilen", row.placed],
    ["Ödenen", row.paid],
    ["Bekleyen", row.pending],
    ["İptal", row.cancelled],
    ["Başarısız ödeme", row.failed],
    ["İade", row.returned],
  ];
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-slate-400 dark:text-zinc-500" aria-hidden />
        {label}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Dönüşüm</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
            {formatPercent(row.conversion_percent)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">İptal oranı</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums text-red-700 dark:text-red-300">
            {formatPercent(row.cancellation_percent)}
          </dd>
        </div>
      </dl>
      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-white/5">
        {counts.map(([name, n]) => (
          <div key={name} className="flex items-baseline justify-between gap-2">
            <dt className="text-slate-500 dark:text-zinc-400">{name}</dt>
            <dd className="font-mono tabular-nums">{formatCount(n)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3 text-xs dark:border-white/5">
        <span className="text-slate-500 dark:text-zinc-400">Ödenen ciro</span>
        <span className="font-mono text-sm font-semibold tabular-nums">{formatMoney(row.revenue)}</span>
      </p>
    </div>
  );
}

function PaymentPanel({ base }: { base: Record<string, string | number> }) {
  const { data, error } = useReport(`payments|${JSON.stringify(base)}`, (signal) => reportPaymentMethods(base, signal));
  return (
    <ReportPanel
      id="payments"
      title="Ödeme Yöntemleri"
      description="Dönemde verilen siparişler, verildikleri güne göre. Oranlar sonuçlanmış siparişler üzerinden; bekleyenler dahil değil."
      actions={<ExportButton report="payment-methods" params={base} />}
      error={error}
    >
      <div className="grid gap-4 px-5 pb-5 pt-4 sm:grid-cols-2">
        {data
          ? data.map((row) => <MethodCard key={row.payment_method} row={row} />)
          : [0, 1].map((i) => <div key={i} className="h-[256px] rounded-xl bg-slate-50 motion-safe:animate-pulse dark:bg-white/[0.03]" />)}
      </div>
    </ReportPanel>
  );
}

function TopPanel({ base }: { base: Record<string, string | number> }) {
  const [by, setBy] = useState<TopBy>("product");
  const [sort, setSort] = useState<TopSort>("revenue");
  const params = { ...base, by, sort, limit: 20 };
  const { data, error, loading } = useReport(`top|${JSON.stringify(params)}`, (signal) => reportTop(params, signal));
  const columns: Column<TopRow & { rank: number }>[] = [
    { key: "rank", header: "#", render: (r) => <Figure muted>{r.rank}</Figure>, className: "w-10" },
    {
      key: "name",
      header: TOP_BY.find((o) => o.value === by)?.label ?? "Ad",
      render: (r) => <ProductCell code={r.code} name={r.name} />,
      sortValue: (r) => r.name,
    },
    { key: "quantity", header: "Adet", align: "right", render: (r) => <Figure>{formatCount(r.quantity)}</Figure>, sortValue: (r) => r.quantity },
    { key: "revenue", header: "Ciro", align: "right", render: (r) => <Figure>{formatMoney(r.revenue)}</Figure>, sortValue: (r) => Number(r.revenue) },
    { key: "orders", header: "Sipariş", align: "right", render: (r) => <Figure muted>{formatCount(r.orders)}</Figure>, sortValue: (r) => r.orders },
  ];
  return (
    <ReportPanel
      id="top"
      title="En Çok Satanlar"
      description="İlk 20; tamamı Excel'de."
      controls={
        <>
          <Segmented label="Gruplama" value={by} options={TOP_BY} onChange={setBy} />
          <Segmented label="Sıralama" value={sort} options={TOP_SORT} onChange={setSort} />
        </>
      }
      actions={<ExportButton report="top" params={{ ...base, by, sort }} />}
      error={error}
    >
      <DataTable
        caption="En çok satanlar"
        columns={columns}
        rows={data?.map((r, i) => ({ ...r, rank: i + 1 })) ?? null}
        rowKey={(r) => r.key || "none"}
        loading={loading}
        empty="Bu dönemde satış yok."
      />
    </ReportPanel>
  );
}

function SlowMoversPanel({ base }: { base: Record<string, string | number> }) {
  const [days, setDays] = useState<"60" | "90">("60");
  const params = { ...base, days };
  const { data, error, loading } = useReport(`slow|${JSON.stringify(params)}`, (signal) => reportSlowMovers(params, signal));
  const columns: Column<SlowMoverRow>[] = [
    {
      key: "name",
      header: "Ürün",
      render: (r) => (
        <ProductCell
          code={r.code}
          name={r.name}
          note={!r.is_published && <span className="text-[11px] text-amber-700 dark:text-amber-300">Yayında değil</span>}
        />
      ),
      sortValue: (r) => r.name,
    },
    { key: "category", header: "Kategori", render: (r) => r.category ?? DASH, sortValue: (r) => r.category },
    { key: "brand", header: "Marka", render: (r) => r.brand ?? DASH, sortValue: (r) => r.brand },
    { key: "stock", header: "Stok", align: "right", render: (r) => <Figure>{formatCount(r.stock)}</Figure>, sortValue: (r) => r.stock },
    {
      key: "value",
      header: "Stok değeri",
      align: "right",
      render: (r) => <Figure>{r.stock_value === null ? DASH : formatMoney(r.stock_value)}</Figure>,
      sortValue: (r) => (r.stock_value === null ? null : Number(r.stock_value)),
    },
    {
      key: "last",
      header: "Son satış",
      align: "right",
      render: (r) => (r.last_sold_at ? <Figure muted>{formatDate(r.last_sold_at)}</Figure> : <span className="text-xs text-slate-500 dark:text-zinc-400">Hiç satılmadı</span>),
      sortValue: (r) => r.last_sold_at,
    },
  ];
  return (
    <ReportPanel
      id="slow"
      title="Satılmayan Stok"
      description={`Stokta olup son ${days} günde hiç satılmayan ürünler, bugünden geriye (dönem seçimi değil; kategori ve marka filtresi geçerli). Stok değeri bugünkü maliyetle.`}
      controls={<Segmented label="Süre" value={days} options={DAYS} onChange={setDays} />}
      actions={<ExportButton report="slow-movers" params={params} />}
      error={error}
    >
      <DataTable
        caption="Satılmayan stok"
        columns={columns}
        rows={data}
        rowKey={(r) => r.product_id}
        loading={loading}
        empty={`Son ${days} günde satılmayan stoklu ürün yok.`}
      />
    </ReportPanel>
  );
}

/** "Satış Raporları": how much, to whom, of what, paid how — and what is not selling. */
export function SalesTab({ filters, threshold }: { filters: ReportFilters; threshold: number }) {
  const base = apiParams(filters);
  return (
    <div className="space-y-6">
      <TrendPanel base={base} />
      <div className="grid gap-6 xl:grid-cols-2">
        <SegmentsPanel base={base} threshold={threshold} />
        <PaymentPanel base={base} />
      </div>
      <TopPanel base={base} />
      <SlowMoversPanel base={base} />
    </div>
  );
}
