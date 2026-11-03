"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { Select } from "@/components/ui/Select";
import {
  RANGE_LABELS,
  defaultFilters,
  hasNarrowing,
  periodProblem,
  periodText,
  rangeDates,
  type QuickRange,
  type ReportFilters,
} from "@/lib/reportFilters";
import type { AdminCategory, Brand } from "@/types";

import { Segmented } from "./Segmented";

const RANGES = (Object.keys(RANGE_LABELS) as QuickRange[]).map((value) => ({ value, label: RANGE_LABELS[value] }));

const SEGMENT_OPTIONS = [
  { value: "RETAIL", label: "Perakende" },
  { value: "CAFE", label: "Kafe" },
  { value: "WHOLESALE", label: "Toptan" },
  { value: "DEALER", label: "Bayi" },
] as const;

/** Top-level categories in menu order, each followed by its subcategories. */
function categoryOptions(categories: AdminCategory[]): { id: number; label: string }[] {
  const order = (a: AdminCategory, b: AdminCategory) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "tr");
  const children = new Map<number, AdminCategory[]>();
  for (const c of categories) {
    if (c.parent_id !== null) children.set(c.parent_id, [...(children.get(c.parent_id) ?? []), c]);
  }
  const out: { id: number; label: string }[] = [];
  const walk = (c: AdminCategory, depth: number) => {
    out.push({ id: c.id, label: `${"   ".repeat(depth)}${depth ? "↳ " : ""}${c.name}` });
    for (const child of (children.get(c.id) ?? []).sort(order)) walk(child, depth + 1);
  };
  const ids = new Set(categories.map((c) => c.id));
  // A parent missing from the list leaves its children at the top, never hidden.
  for (const root of categories.filter((c) => c.parent_id === null || !ids.has(c.parent_id)).sort(order)) walk(root, 0);
  return out;
}

const DATE_INPUT =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:[color-scheme:dark]";

/** The period and the four filters every report on the page shares. */
export function ReportFiltersBar({
  filters,
  today,
  categories,
  brands,
  onChange,
}: {
  filters: ReportFilters;
  today: string;
  categories: AdminCategory[];
  brands: Brand[];
  onChange: (next: ReportFilters) => void;
}) {
  const id = useId();
  // The two dates as typed: only a period that holds up reaches the address.
  const [draft, setDraft] = useState({ from: filters.from, to: filters.to });
  const [draftFor, setDraftFor] = useState(`${filters.from}|${filters.to}`);
  if (draftFor !== `${filters.from}|${filters.to}`) {
    // The period changed from outside (a quick range, the back button).
    setDraftFor(`${filters.from}|${filters.to}`);
    setDraft({ from: filters.from, to: filters.to });
  }
  const problem = filters.range === "custom" ? periodProblem(draft.from, draft.to) : null;

  function pickRange(range: QuickRange) {
    if (range === "custom") onChange({ ...filters, range });
    else onChange({ ...filters, range, ...rangeDates(range, today) });
  }

  function typeDate(which: "from" | "to", value: string) {
    const next = { ...draft, [which]: value };
    setDraft(next);
    if (!periodProblem(next.from, next.to)) onChange({ ...filters, range: "custom", ...next });
  }

  const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const options = categoryOptions(categories);

  return (
    <section aria-label="Rapor filtreleri" className={`${panelClass} px-5 py-4`}>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Dönem" value={filters.range} options={RANGES} onChange={pickRange} />
        <p className="font-mono text-xs text-slate-500 tabular-nums dark:text-zinc-400">{periodText(filters.from, filters.to)}</p>
        {(hasNarrowing(filters) || filters.range !== "month") && (
          <button
            type="button"
            onClick={() => onChange(defaultFilters(today))}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-red-500 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Filtreleri temizle
          </button>
        )}
      </div>

      {filters.range === "custom" && (
        <div className="mt-4 grid gap-3 sm:max-w-md sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor={`${id}-from`} className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Başlangıç
            </label>
            <input id={`${id}-from`} type="date" value={draft.from} max={today} onChange={(e) => typeDate("from", e.target.value)} className={DATE_INPUT} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-to`} className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Bitiş
            </label>
            <input id={`${id}-to`} type="date" value={draft.to} max={today} onChange={(e) => typeDate("to", e.target.value)} className={DATE_INPUT} />
          </div>
          {problem && (
            <p role="alert" className="text-xs text-red-600 sm:col-span-2 dark:text-red-400">
              {problem}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          label="Müşteri grubu"
          value={filters.segment}
          onChange={(e) => onChange({ ...filters, segment: e.target.value as ReportFilters["segment"] })}
        >
          <option value="">Tümü</option>
          {SEGMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          label="Ödeme yöntemi"
          value={filters.paymentMethod}
          onChange={(e) => onChange({ ...filters, paymentMethod: e.target.value as ReportFilters["paymentMethod"] })}
        >
          <option value="">Tümü</option>
          <option value="CREDIT_CARD">Kredi Kartı</option>
          <option value="BANK_TRANSFER">Havale/EFT</option>
        </Select>
        <Select
          label="Kategori (alt kategorileriyle)"
          value={filters.categoryId ?? ""}
          onChange={(e) => onChange({ ...filters, categoryId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Tümü</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          label="Marka"
          value={filters.brandId ?? ""}
          onChange={(e) => onChange({ ...filters, brandId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Tümü</option>
          {sortedBrands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>
    </section>
  );
}
