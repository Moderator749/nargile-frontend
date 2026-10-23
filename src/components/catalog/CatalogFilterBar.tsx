"use client";

import { useId, useSyncExternalStore, type ReactNode } from "react";
import { Check, LayoutGrid, PanelLeftClose, PanelLeftOpen, Square } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { SORT_OPTIONS, type CatalogFilters, type SortKey } from "@/lib/catalogFilters";
import { setCatalogDensity, useCatalogDensity } from "@/lib/catalogView";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { isSidebarCollapsed, setSidebarCollapsed, subscribeSidebar } from "@/lib/sidebar";

// On a phone the bar is one compact row, so its labels are for screen readers only.
const LABEL = "text-[11px] font-bold uppercase tracking-wider text-neutral-500 max-md:sr-only dark:text-neutral-400";
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
 * the column beside the category sidebar has the room); a tablet wraps.
 *
 * On a phone it is a compact strip instead, held under the header as the grid
 * scrolls: one line edge to edge (the labels for screen readers only), sliding
 * sideways if an account's extra button does not fit, and ending in the
 * grid's two-or-one switch (`DensityToggle`).
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

/**
 * A phone's grid: two products to a row (the default) or one, full width.
 * Remembered in this browser (lib/catalogView). Phones only: wider screens
 * have their own columns.
 */
function DensityToggle() {
  const density = useCatalogDensity();
  const t = useMessages(catalogMessages).filters;
  const option = (value: "two" | "one", label: string, Icon: typeof LayoutGrid) => (
    <button
      type="button"
      onClick={() => setCatalogDensity(value)}
      aria-pressed={density === value}
      aria-label={label}
      title={label}
      className={`flex h-7 w-6 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
        density === value
          ? "bg-white text-red-600 shadow-sm dark:bg-neutral-700 dark:text-red-400"
          : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
  return (
    <div
      role="group"
      aria-label={t.view}
      className="flex h-9 shrink-0 items-center gap-0.5 rounded-xl border border-neutral-200 bg-neutral-100 p-0.5 md:hidden dark:border-neutral-700 dark:bg-neutral-800"
    >
      {option("two", t.viewTwo, LayoutGrid)}
      {option("one", t.viewOne, Square)}
    </div>
  );
}

export function CatalogFilterBar({ value, onChange, bounds, trailing }: CatalogFilterBarProps) {
  const minId = useId();
  const maxId = useId();
  const sortId = useId();
  const t = useMessages(catalogMessages).filters;

  return (
    <div
      className={[
        "flex w-full items-center gap-1.5 md:gap-2 border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900",
        // Tablet and up: the rounded box it has always been.
        "md:mb-8 md:flex-wrap md:justify-between md:rounded-2xl md:border md:p-4 md:shadow-sm",
        // Phone: a strip held under the header (--header-height, set by the
        // Navbar), edge to edge across the page's padding, one line.
        "max-md:sticky max-md:top-[var(--header-height,4rem)] max-md:z-30 max-md:mb-4 max-md:-mx-4 max-md:w-auto max-md:flex-nowrap max-md:overflow-x-auto max-md:border-b max-md:bg-white/95 max-md:px-4 max-md:py-2 max-md:shadow-[0_6px_12px_-10px_rgb(0_0_0/0.35)] max-md:backdrop-blur-md max-md:[scrollbar-width:none] sm:max-md:-mx-6 sm:max-md:px-6 dark:max-md:bg-neutral-900/95",
      ].join(" ")}
    >
      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        <SidebarToggle />
        {/* A phone has room for a word, not the label: "Fiyat:" (the full one is for screen readers). */}
        <span aria-hidden className="me-0.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-neutral-500 md:hidden dark:text-neutral-400">
          {t.priceShort}
        </span>
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
          className={`${FIELD} w-10 text-center max-md:px-0.5 md:w-16`}
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
          className={`${FIELD} w-10 text-center max-md:px-0.5 md:w-16`}
        />
      </div>

      {/* A button rather than a checkbox: `aria-pressed` says the same thing to
          a screen reader, and the pill can then carry the shop's red when on. */}
      <button
        type="button"
        aria-pressed={value.inStock}
        onClick={() => onChange({ inStock: !value.inStock })}
        // Not on a phone: the strip keeps the price, the sort and the grid's switch.
        className={`hidden h-9 shrink-0 md:flex select-none items-center gap-1.5 whitespace-nowrap rounded-xl border px-2 text-[11px] md:gap-2 md:px-3 font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          value.inStock
            ? "border-red-600 bg-red-600 text-white shadow-sm"
            : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-red-400/50 hover:text-red-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        }`}
      >
        {/* On a phone the pill's own red says it is on; the box needs the room. */}
        <span
          aria-hidden
          className={`flex h-4 w-4 items-center justify-center rounded-md border transition-colors duration-200 max-md:hidden ${
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
      <div
        className={`flex items-center justify-end gap-2 max-md:min-w-[4.5rem] max-md:flex-1 md:shrink-0 md:flex-wrap xl:flex-nowrap ${trailing ? "md:ms-auto" : ""}`}
      >
        <label className={`${LABEL} whitespace-nowrap`} htmlFor={sortId}>
          {t.sort}
        </label>
        <select
          id={sortId}
          value={value.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortKey })}
          className={`${FIELD} cursor-pointer pe-8 max-md:w-full max-md:min-w-0 max-md:px-2 max-md:pe-6 max-md:text-[11px] md:w-36`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t.sortOptions[option.value]}
            </option>
          ))}
        </select>
        {trailing}
      </div>
      <DensityToggle />
    </div>
  );
}
