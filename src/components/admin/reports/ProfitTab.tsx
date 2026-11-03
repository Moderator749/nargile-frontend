"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { formatMoney } from "@/lib/format";
import { apiParams, type ReportFilters } from "@/lib/reportFilters";
import { DASH, formatCount } from "@/lib/reportFormat";
import {
  reportMissingCosts,
  reportProfitability,
  reportTierMargins,
  type MissingCostRow,
  type ProfitBy,
  type ProfitRow,
  type ProfitSort,
  type TierMargin,
  type TierMarginRow,
} from "@/lib/reportsApi";
import type { SegmentType } from "@/types";

import { DataTable, Figure, ProductCell, type Column } from "./DataTable";
import { ExportButton } from "./ExportButton";
import { MarginBadge } from "./MarginBadge";
import { ReportPanel } from "./ReportPanel";
import { Segmented } from "./Segmented";
import { useReport } from "./useReport";

type Params = Record<string, string | number | boolean>;

const PROFIT_BY: { value: ProfitBy; label: string }[] = [
  { value: "product", label: "Ürün" },
  { value: "category", label: "Kategori" },
];
const PROFIT_SORT: { value: ProfitSort; label: string }[] = [
  { value: "profit", label: "Kâra göre" },
  { value: "margin", label: "En düşük marj" },
  { value: "revenue", label: "Ciroya göre" },
];
const ALERTS = [
  { value: "all", label: "Tüm ürünler" },
  { value: "alerts", label: "Yalnız uyarılar" },
] as const;
const TIERS: { segment: SegmentType; label: string }[] = [
  { segment: "RETAIL", label: "Perakende" },
  { segment: "CAFE", label: "Kafe" },
  { segment: "WHOLESALE", label: "Toptan" },
  { segment: "DEALER", label: "Bayi" },
];

/** "Marj eşiği": typed as a percent, applied on Enter or on leaving the box. */
function ThresholdControl({ threshold, onChange }: { threshold: number; onChange: (value: number) => void }) {
  const id = useId();
  const [typed, setTyped] = useState(String(threshold));
  const [typedFor, setTypedFor] = useState(threshold);
  if (typedFor !== threshold) {
    setTypedFor(threshold);
    setTyped(String(threshold));
  }

  function apply() {
    const n = Number(typed.replace(",", "."));
    if (Number.isFinite(n) && n >= 0 && n <= 100) onChange(Math.round(n * 10) / 10);
    else setTyped(String(threshold));
  }

  return (
    <section aria-label="Marj eşiği" className={`${panelClass} flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4`}>
      <label htmlFor={id} className="text-sm font-medium">
        Marj eşiği
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-slate-400 dark:text-zinc-500">%</span>
        <input
          id={id}
          inputMode="decimal"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="h-10 w-24 rounded-lg border border-slate-300 bg-white ps-7 pe-3 font-mono text-sm tabular-nums shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900"
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-zinc-400">
        Bu oranın altındaki marjlar kırmızı <strong className="font-semibold">Marj Erozyonu</strong> uyarısı alır; 5 puan üstüne kadar sarı.
      </p>
    </section>
  );
}

function ProfitPanel({ base, threshold }: { base: Params; threshold: number }) {
  const [by, setBy] = useState<ProfitBy>("product");
  const [sort, setSort] = useState<ProfitSort>("profit");
  const params = { ...base, by, sort, threshold, limit: 100 };
  const { data, error, loading } = useReport(`profit|${JSON.stringify(params)}`, (signal) => reportProfitability(params, signal));
  const money = (v: string | null) => (v === null ? DASH : formatMoney(v));
  const columns: Column<ProfitRow>[] = [
    {
      key: "name",
      header: by === "product" ? "Ürün" : "Kategori",
      render: (r) => (
        <ProductCell
          code={r.code}
          name={r.name}
          note={
            (r.estimated || r.uncosted_quantity > 0) && (
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                {r.estimated && "Tahmini maliyet"}
                {r.estimated && r.uncosted_quantity > 0 && " · "}
                {r.uncosted_quantity > 0 && `${formatCount(r.uncosted_quantity)} adet maliyetsiz`}
              </span>
            )
          }
        />
      ),
      sortValue: (r) => r.name,
    },
    { key: "qty", header: "Adet", align: "right", render: (r) => <Figure>{formatCount(r.quantity)}</Figure>, sortValue: (r) => r.quantity },
    {
      key: "revenue",
      header: "Ciro (KDV hariç)",
      align: "right",
      render: (r) => <Figure>{formatMoney(r.revenue_excl_vat)}</Figure>,
      sortValue: (r) => Number(r.revenue_excl_vat),
    },
    { key: "cost", header: "Maliyet", align: "right", render: (r) => <Figure muted>{money(r.cost)}</Figure>, sortValue: (r) => (r.cost === null ? null : Number(r.cost)) },
    {
      key: "profit",
      header: "Brüt kâr",
      align: "right",
      render: (r) => <Figure>{money(r.gross_profit)}</Figure>,
      sortValue: (r) => (r.gross_profit === null ? null : Number(r.gross_profit)),
    },
    {
      key: "margin",
      header: "Marj",
      align: "right",
      render: (r) => <MarginBadge value={r.margin_percent} threshold={threshold} />,
      sortValue: (r) => (r.margin_percent === null ? null : Number(r.margin_percent)),
    },
  ];
  return (
    <ReportPanel
      id="profit"
      title="Brüt Kâr ve Marj"
      description="Dönemde satılanlar; KDV hariç, satır indirimleri düşülmüş. Maliyeti olmayan satırlar marja girmez. İlk 100; tamamı Excel'de."
      controls={
        <>
          <Segmented label="Gruplama" value={by} options={PROFIT_BY} onChange={setBy} />
          <Segmented label="Sıralama" value={sort} options={PROFIT_SORT} onChange={setSort} />
        </>
      }
      actions={<ExportButton report="profitability" params={{ ...base, by, sort, threshold }} />}
      error={error}
    >
      <DataTable
        caption="Brüt kâr ve marj"
        columns={columns}
        rows={data}
        rowKey={(r) => r.key || "none"}
        loading={loading}
        empty="Bu dönemde satış yok."
        rowClassName={(r) => (r.below_threshold ? "bg-red-50/60 dark:bg-red-500/[0.06]" : "")}
      />
    </ReportPanel>
  );
}

function TierCell({ tier, threshold }: { tier: TierMargin | undefined; threshold: number }) {
  if (!tier || tier.price_excl_vat === null) return <span className="text-slate-400 dark:text-zinc-500">{DASH}</span>;
  return (
    <div className="flex flex-col items-end gap-1">
      <MarginBadge value={tier.margin_percent} threshold={threshold} />
      {tier.havale_margin_percent !== null && (
        <span title={`Havale/EFT ile %${tier.havale_rate_percent} indirim sonrası: ${formatMoney(tier.havale_price_excl_vat ?? 0)}`}>
          <MarginBadge value={tier.havale_margin_percent} threshold={threshold} prefix="Havale" />
        </span>
      )}
      <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-zinc-400">{formatMoney(tier.price_excl_vat)}</span>
    </div>
  );
}

function TierMarginsPanel({ base, threshold }: { base: Params; threshold: number }) {
  const [show, setShow] = useState<"all" | "alerts">("alerts");
  const params = { ...base, threshold, only_alerts: show === "alerts", limit: 200 };
  const { data, error, loading } = useReport(`tiers|${JSON.stringify(params)}`, (signal) => reportTierMargins(params, signal));
  const alerts = data?.filter((r) => r.alert).length ?? 0;
  const tier = (r: TierMarginRow, s: SegmentType) => r.tiers.find((t) => t.segment === s);
  const columns: Column<TierMarginRow>[] = [
    {
      key: "name",
      header: "Ürün",
      render: (r) => (
        <ProductCell
          code={r.code}
          name={r.name}
          note={
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
              {r.alert && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-600 px-1.5 py-px font-semibold text-white dark:bg-red-500">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  Marj Erozyonu
                </span>
              )}
              {r.brand}
            </span>
          }
        />
      ),
      sortValue: (r) => r.name,
    },
    { key: "cost", header: "Maliyet", align: "right", render: (r) => <Figure muted>{formatMoney(r.cost)}</Figure>, sortValue: (r) => Number(r.cost) },
    ...TIERS.map(
      ({ segment, label }): Column<TierMarginRow> => ({
        key: segment,
        header: label,
        align: "right",
        render: (r) => <TierCell tier={tier(r, segment)} threshold={threshold} />,
        sortValue: (r) => {
          const t = tier(r, segment);
          const m = t?.havale_margin_percent ?? t?.margin_percent;
          return m == null ? null : Number(m);
        },
      }),
    ),
  ];
  return (
    <ReportPanel
      id="tiers"
      title="Fiyat Grubu Marjları"
      description={
        <>
          Bugünkü liste fiyatları bugünkü maliyete karşı, KDV hariç. &quot;Havale&quot;: havale/EFT merdiveninin en yüksek indirimiyle
          (Perakende her üründe, Kafe/Toptan/Bayi ürünün o grup için havale indirimi açıksa). Dönem ve müşteri grubu filtresi uygulanmaz.
          {data && show === "alerts" && ` ${formatCount(alerts)} üründe uyarı.`}
        </>
      }
      controls={<Segmented label="Gösterilen ürünler" value={show} options={ALERTS} onChange={setShow} />}
      actions={<ExportButton report="tier-margins" params={{ ...base, threshold, only_alerts: show === "alerts" }} />}
      error={error}
    >
      <DataTable
        caption="Fiyat grubu marjları"
        columns={columns}
        rows={data}
        rowKey={(r) => r.product_id}
        loading={loading}
        empty={show === "alerts" ? "Eşiğin altında marjı olan ürün yok." : "Maliyeti girilmiş ürün yok."}
        rowClassName={(r) => (r.alert ? "bg-red-50/60 dark:bg-red-500/[0.06]" : "")}
      />
    </ReportPanel>
  );
}

function MissingCostsPanel({ base }: { base: Params }) {
  const params = { ...base, limit: 200 };
  const { data, error, loading } = useReport(`missing|${JSON.stringify(params)}`, (signal) => reportMissingCosts(params, signal));
  const columns: Column<MissingCostRow>[] = [
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
    { key: "sold", header: "90 gün adet", align: "right", render: (r) => <Figure>{formatCount(r.sold_quantity_90d)}</Figure>, sortValue: (r) => r.sold_quantity_90d },
    { key: "revenue", header: "90 gün ciro", align: "right", render: (r) => <Figure>{formatMoney(r.revenue_90d)}</Figure>, sortValue: (r) => Number(r.revenue_90d) },
  ];
  return (
    <ReportPanel
      id="missing"
      title="Maliyeti Eksik Ürünler"
      description={
        <>
          Satıştaki rengi maliyetsiz olan ürünler; son 90 günde en çok satanlar önce. Bunlar marj hesaplarına girmez. Maliyet,{" "}
          <Link href="/admin/pricing-calculator" className="font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-400">
            Fiyat Hesaplama Cetveli
          </Link>
          &apos;nde &quot;Dosya ve Sitede Ürüne Kaydet&quot; ile yazılır.
        </>
      }
      actions={<ExportButton report="missing-costs" params={base} />}
      error={error}
    >
      <DataTable
        caption="Maliyeti eksik ürünler"
        columns={columns}
        rows={data}
        rowKey={(r) => r.product_id}
        loading={loading}
        empty="Satıştaki her ürünün maliyeti var."
      />
    </ReportPanel>
  );
}

/** "Kârlılık Raporları": profit on what sold, margins on today's prices, and the gaps in the costs. */
export function ProfitTab({
  filters,
  threshold,
  onThresholdChange,
}: {
  filters: ReportFilters;
  threshold: number;
  onThresholdChange: (value: number) => void;
}) {
  const base = apiParams(filters);
  return (
    <div className="space-y-6">
      <ThresholdControl threshold={threshold} onChange={onThresholdChange} />
      <ProfitPanel base={base} threshold={threshold} />
      <TierMarginsPanel base={base} threshold={threshold} />
      <MissingCostsPanel base={base} />
    </div>
  );
}
