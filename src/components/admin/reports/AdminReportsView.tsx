"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgePercent, TrendingUp } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";
import { adminListBrands, adminListCategories } from "@/lib/adminApi";
import { apiParams, filtersFromParams, filtersToParams, turkeyToday, type ReportFilters } from "@/lib/reportFilters";
import { reportSummary } from "@/lib/reportsApi";
import type { AdminCategory, Brand } from "@/types";

import { KpiCards } from "./KpiCards";
import { ProfitTab } from "./ProfitTab";
import { ReportFiltersBar } from "./ReportFiltersBar";
import { SalesTab } from "./SalesTab";
import { useReport } from "./useReport";

type Tab = "sales" | "profit";

const TAB_PARAM = "sekme";
const THRESHOLD_PARAM = "esik";
const DEFAULT_THRESHOLD = 15;
const TABS: { value: Tab; slug: string; label: string; Icon: typeof TrendingUp }[] = [
  { value: "sales", slug: "satis", label: "Satış", Icon: TrendingUp },
  { value: "profit", slug: "karlilik", label: "Kârlılık", Icon: BadgePercent },
];

function thresholdOf(raw: string | null): number {
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : DEFAULT_THRESHOLD;
}

/**
 * Raporlar. Everything the page shows is in its address — the period, the
 * filters, the tab and the margin threshold — so a reload or a shared link
 * opens the same view. The tab that is not shown is not fetched.
 */
export function AdminReportsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = turkeyToday();
  const filters = filtersFromParams(searchParams, today);
  const tab: Tab = TABS.find((t) => t.slug === searchParams.get(TAB_PARAM))?.value ?? "sales";
  const threshold = thresholdOf(searchParams.get(THRESHOLD_PARAM));

  const [taxonomy, setTaxonomy] = useState<{ categories: AdminCategory[]; brands: Brand[] }>({ categories: [], brands: [] });
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([adminListCategories(controller.signal), adminListBrands(controller.signal)])
      .then(([categories, brands]) => setTaxonomy({ categories, brands }))
      // Without them the two filters offer "Tümü" only; the reports still load.
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  function go(next: { filters?: ReportFilters; tab?: Tab; threshold?: number }) {
    const params = filtersToParams(next.filters ?? filters);
    const t = next.tab ?? tab;
    if (t !== "sales") params.set(TAB_PARAM, TABS.find((x) => x.value === t)!.slug);
    const th = next.threshold ?? threshold;
    if (th !== DEFAULT_THRESHOLD) params.set(THRESHOLD_PARAM, String(th));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const base = apiParams(filters);
  const summary = useReport(`summary|${JSON.stringify(base)}`, (signal) => reportSummary(base, signal));

  return (
    <>
      <AdminPageHeader
        title="Raporlar"
        description="Satış ve kârlılık, ödenmiş siparişlere göre (Türkiye saati). Her tablo filtreleriyle birlikte Excel'e aktarılabilir."
      />

      <div className="space-y-6">
        <ReportFiltersBar
          filters={filters}
          today={today}
          categories={taxonomy.categories}
          brands={taxonomy.brands}
          onChange={(next) => go({ filters: next })}
        />

        <section aria-label="Dönem özeti">
          {summary.error && (
            <div className="mb-4">
              <Alert variant="error">{summary.error}</Alert>
            </div>
          )}
          <KpiCards summary={summary.data} />
        </section>

        <div>
          <div role="tablist" aria-label="Raporlar" className="mb-6 flex gap-1 border-b border-slate-200 dark:border-white/10">
            {TABS.map(({ value, label, Icon }) => {
              const selected = value === tab;
              return (
                <button
                  key={value}
                  id={`reports-tab-${value}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`reports-panel-${value}`}
                  onClick={() => go({ tab: value })}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-500 ${
                    selected
                      ? "border-red-600 text-red-700 dark:border-red-500 dark:text-red-400"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
          <div role="tabpanel" id={`reports-panel-${tab}`} aria-labelledby={`reports-tab-${tab}`}>
            <h2 className="sr-only">{tab === "sales" ? "Satış raporları" : "Kârlılık raporları"}</h2>
            {tab === "sales" ? (
              <SalesTab filters={filters} threshold={threshold} />
            ) : (
              <ProfitTab filters={filters} threshold={threshold} onThresholdChange={(value) => go({ threshold: value })} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
