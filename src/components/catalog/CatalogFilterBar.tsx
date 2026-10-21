"use client";

import { useId, useSyncExternalStore, type ReactNode } from "react";
import { Check, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { SORT_OPTIONS, type CatalogFilters, type SortKey } from "@/lib/catalogFilters";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { isSidebarCollapsed, setSidebarCollapsed, subscribeSidebar } from "@/lib/sidebar";

const LABEL = "text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400";
// One height for every control in the bar: the price boxes, the stock pill,
// the sort and the catalogue button (PriceCatalogExport) are all h-9.
const FIELD = [
  "h-9 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-xs font-bold text-neutral-800",
  "transition-colors duration-200 focus:border-red-500 focus:outline-none",
  "dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
].join(" ");

interface CatalogFilterBarProps {
  value: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  /** The cheapest and dearest on screen, shown as the inputs' placeholders. */
  bounds: { min: number; max: number } | null;
  /** Beside the sort, at the far end of the bar (the B2B catalogue download). */
  trailing?: ReactNode;
}

/**
 * One row, three controls: price range, stock, sort — and, for a B2B account,
 * the catalogue button at the far right. One line on a desktop (from xl, where
 * the column beside the category sidebar has the room); narrower screens wrap.
 *
 * Everything here narrows what is already on screen (see `lib/catalogFilters`),
 * so the controls are plain inputs rather than links: there is no URL behind
 * them to crawl, and the grid answers immediately.
 */
/**
 * The category column's switch, where the shopping happens: the same state as
 * the header's "KATEGORİLER" button (lib/sidebar), so hiding the column for a
 * wider grid is in reach from the grid itself. Red and worded like the panel's
 * other actions ("PDF Oluştur"), so it is seen. Desktop only — on a phone the
 * column is a drawer, opened from the header.
 */
function SidebarToggle() {
  // Catalog pages open with the column showing, which is what the server renders.
  const collapsed = useSyncExternalStore(subscribeSidebar, isSidebarCollapsed, () => false);
  const t = useMessages(catalogMessages).filters;
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={() => setSidebarCollapsed(!collapsed)}
      aria-expanded={!collapsed}
      className="hidden h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-600 bg-red-600 px-2.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition-colors duration-200 hover:border-red-500 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:inline-flex"
    >
      {/* The column is at the reading direction's start: on the right in Arabic. */}
      <Icon className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
      {collapsed ? t.showCategories : t.widenPage}
    </button>
  );
}

export function CatalogFilterBar({ value, onChange, bounds, trailing }: CatalogFilterBarProps) {
  const minId = useId();
  const maxId = useId();
  const sortId = useId();
  const t = useMessages(catalogMessages).filters;

  return (
    <div className="mb-8 flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm sm:p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex shrink-0 items-center gap-2">
        <SidebarToggle />
        <span className={`${LABEL} whitespace-nowrap`} id={`${minId}-label`}>
          {t.priceRange}
        </span>
        <label className="sr-only" htmlFor={minId}>
          {t.minPrice}
        </label>
        <input
          id={minId}
          inputMode="decimal"
          maxLength={9}
          value={value.min}
          onChange={(e) => onChange({ min: e.target.value })}
          placeholder={bounds ? String(bounds.min) : "0"}
          className={`${FIELD} w-16 text-center`}
        />
        <span aria-hidden className="text-xs font-bold text-neutral-400">
          –
        </span>
        <label className="sr-only" htmlFor={maxId}>
          {t.maxPrice}
        </label>
        <input
          id={maxId}
          inputMode="decimal"
          maxLength={9}
          value={value.max}
          onChange={(e) => onChange({ max: e.target.value })}
          placeholder={bounds ? String(bounds.max) : "1000"}
          className={`${FIELD} w-16 text-center`}
        />
      </div>

      {/* A button rather than a checkbox: `aria-pressed` says the same thing to
          a screen reader, and the pill can then carry the shop's red when on. */}
      <button
        type="button"
        aria-pressed={value.inStock}
        onClick={() => onChange({ inStock: !value.inStock })}
        className={`flex h-9 shrink-0 select-none items-center gap-2 whitespace-nowrap rounded-xl border px-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          value.inStock
            ? "border-red-600 bg-red-600 text-white shadow-sm"
            : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-red-400/50 hover:text-red-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        }`}
      >
        <span
          aria-hidden
          className={`flex h-4 w-4 items-center justify-center rounded-md border transition-colors duration-200 ${
            value.inStock ? "border-white/70 bg-white/20" : "border-neutral-300 dark:border-neutral-600"
          }`}
        >
          {value.inStock && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
        {t.inStock}
      </button>

      {/* With something beside the sort (the catalogue button) the group may
          wrap under the rest; it stays in the far corner (the left in Arabic) when it does.
          Without it, the bar keeps its three-way spacing. */}
      <div className={`flex flex-wrap items-center justify-end gap-2 xl:flex-nowrap ${trailing ? "ms-auto" : ""}`}>
        <label className={`${LABEL} whitespace-nowrap`} htmlFor={sortId}>
          {t.sort}
        </label>
        <select
          id={sortId}
          value={value.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortKey })}
          className={`${FIELD} w-36 cursor-pointer pe-8`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t.sortOptions[option.value]}
            </option>
          ))}
        </select>
        {trailing}
      </div>
    </div>
  );
}
