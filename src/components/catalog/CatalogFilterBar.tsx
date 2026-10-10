"use client";

import { useId } from "react";
import { Check } from "lucide-react";

import { SORT_OPTIONS, type CatalogFilters, type SortKey } from "@/lib/catalogFilters";

const LABEL = "text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400";
const FIELD = [
  "rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-bold text-neutral-800",
  "transition-colors duration-200 focus:border-red-500 focus:outline-none",
  "dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
].join(" ");

interface CatalogFilterBarProps {
  value: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  /** The cheapest and dearest on screen, shown as the inputs' placeholders. */
  bounds: { min: number; max: number } | null;
}

/**
 * One row, three controls: price range, stock, sort.
 *
 * Everything here narrows what is already on screen (see `lib/catalogFilters`),
 * so the controls are plain inputs rather than links: there is no URL behind
 * them to crawl, and the grid answers immediately.
 */
export function CatalogFilterBar({ value, onChange, bounds }: CatalogFilterBarProps) {
  const minId = useId();
  const maxId = useId();
  const sortId = useId();

  return (
    <div className="mb-8 flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm sm:p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span className={LABEL} id={`${minId}-label`}>
          Fiyat Aralığı
        </span>
        <label className="sr-only" htmlFor={minId}>
          En düşük fiyat
        </label>
        <input
          id={minId}
          inputMode="decimal"
          maxLength={9}
          value={value.min}
          onChange={(e) => onChange({ min: e.target.value })}
          placeholder={bounds ? String(bounds.min) : "0"}
          className={`${FIELD} w-20 text-center sm:w-24`}
        />
        <span aria-hidden className="text-xs font-bold text-neutral-400">
          –
        </span>
        <label className="sr-only" htmlFor={maxId}>
          En yüksek fiyat
        </label>
        <input
          id={maxId}
          inputMode="decimal"
          maxLength={9}
          value={value.max}
          onChange={(e) => onChange({ max: e.target.value })}
          placeholder={bounds ? String(bounds.max) : "1000"}
          className={`${FIELD} w-20 text-center sm:w-24`}
        />
      </div>

      {/* A button rather than a checkbox: `aria-pressed` says the same thing to
          a screen reader, and the pill can then carry the shop's red when on. */}
      <button
        type="button"
        aria-pressed={value.inStock}
        onClick={() => onChange({ inStock: !value.inStock })}
        className={`flex select-none items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
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
        Stokta Olanlar
      </button>

      <div className="flex items-center gap-2">
        <label className={LABEL} htmlFor={sortId}>
          Sırala
        </label>
        <select
          id={sortId}
          value={value.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortKey })}
          className={`${FIELD} cursor-pointer py-[7px] pr-8`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
