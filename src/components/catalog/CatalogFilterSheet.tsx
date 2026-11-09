"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import type { CatalogFilters } from "@/lib/catalogFilters";
import { catalogMessages } from "@/lib/i18n/messages/catalog";

// 16px type: a phone's browser zooms into a smaller field.
const FIELD =
  "h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-base font-semibold text-neutral-800 transition-colors duration-200 focus:border-red-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";

/**
 * A phone's price range and "Stokta Olanlar": the strip has room for the sort
 * and the grid's switch only, so these open from its "Filtrele" button as a
 * sheet from the foot of the screen. Each change narrows the grid at once,
 * as on a desktop; "Ürünleri Göster" only closes the sheet. A dot on the
 * button says a filter is on while the sheet is closed.
 */
export function CatalogFilterSheet({
  value,
  onChange,
  bounds,
}: {
  value: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  bounds: { min: number; max: number } | null;
}) {
  const t = useMessages(catalogMessages).filters;
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const active = !!value.min.trim() || !!value.max.trim() || value.inStock;

  // The native dialog brings the focus trap, Escape and the inert page behind.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-controls={`${id}-sheet`}
        className={`relative flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden ${
          active
            ? "border-red-600 bg-red-50 text-red-700 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-300"
            : "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        {t.filter}
        {active && <span aria-hidden className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-neutral-900" />}
      </button>

      <dialog
        ref={dialog}
        id={`${id}-sheet`}
        aria-labelledby={`${id}-title`}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) setOpen(false);
        }}
        className="mx-0 mb-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] text-neutral-900 backdrop:bg-black/50 md:hidden dark:bg-neutral-900 dark:text-neutral-100"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 id={`${id}-title`} className="text-base font-bold">
            {t.filterTitle}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.closeFilters}
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-white/5 dark:hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-6 px-4 py-5">
          <fieldset>
            <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{t.priceRange}</legend>
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <span className="sr-only">{t.minPrice}</span>
                <input
                  inputMode="decimal"
                  maxLength={9}
                  value={value.min}
                  onChange={(e) => onChange({ min: e.target.value })}
                  placeholder={bounds ? String(bounds.min) : "0"}
                  className={FIELD}
                />
              </label>
              <span aria-hidden className="font-bold text-neutral-400">–</span>
              <label className="flex-1">
                <span className="sr-only">{t.maxPrice}</span>
                <input
                  inputMode="decimal"
                  maxLength={9}
                  value={value.max}
                  onChange={(e) => onChange({ max: e.target.value })}
                  placeholder={bounds ? String(bounds.max) : "1000"}
                  className={FIELD}
                />
              </label>
            </div>
          </fieldset>

          <button
            type="button"
            aria-pressed={value.inStock}
            onClick={() => onChange({ inStock: !value.inStock })}
            className="flex h-12 w-full items-center gap-3 rounded-xl border border-neutral-200 px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent dark:border-neutral-700"
          >
            <span
              aria-hidden
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors duration-200 ${
                value.inStock ? "border-red-600 bg-red-600 text-white" : "border-neutral-300 dark:border-neutral-600"
              }`}
            >
              {value.inStock && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            {t.inStock}
          </button>
        </div>

        <div className="flex gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => onChange({ min: "", max: "", inStock: false })}
            disabled={!active}
            className="h-12 rounded-xl px-4 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-white/5"
          >
            {t.clearFilters}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-12 flex-1 rounded-xl bg-red-600 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-500"
          >
            {t.showResults}
          </button>
        </div>
      </dialog>
    </>
  );
}
