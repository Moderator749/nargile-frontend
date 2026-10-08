"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Loader2, Plus, Search, X } from "lucide-react";

import { sheetInputClass } from "@/components/admin/products/SheetParts";
import { adminListProductsPage } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import type { AdminProduct, CrossSellCard, CurrencyType } from "@/types";

export const MAX_CROSS_SELLS = 4;
const DEBOUNCE_MS = 300;

/** The public (RETAIL) price of a product, as entered, for the preview card. */
function retailPrice(product: AdminProduct): { amount: string; currency: CurrencyType } | null {
  for (const variant of product.variants) {
    // Segment 1 is RETAIL (seeded first); its TRY row is the public price.
    const row = variant.prices.find((p) => p.segment_id === 1) ?? variant.prices[0];
    if (row) return { amount: row.price_incl_tax, currency: row.currency };
  }
  return null;
}

const cardOf = (product: AdminProduct): CrossSellCard => {
  const price = retailPrice(product);
  return {
    id: product.id,
    base_code: product.base_code,
    name: product.name,
    image_url: product.image_url,
    price_incl_tax: price?.amount ?? null,
    currency: price?.currency ?? null,
  };
};

/**
 * "Birlikte Satılanlar": search the catalogue, pin up to four products, and see
 * them as the cards the product page will show. The grid always holds four slots,
 * so the section keeps its height as products come and go.
 */
export function CrossSellPicker({
  selected,
  onChange,
  excludeId,
}: {
  selected: CrossSellCard[];
  onChange: (cards: CrossSellCard[]) => void;
  /** The product being edited: it cannot be sold with itself. */
  excludeId?: string;
}) {
  const [query, setQuery] = useState("");
  // Results are kept with the term they belong to, so what is shown is derived
  // rather than cleared by an effect as the admin types.
  const [found, setFound] = useState<{ term: string; products: AdminProduct[] } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const full = selected.length >= MAX_CROSS_SELLS;
  const term = query.trim();
  const searchable = term.length >= 2 && !full;

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      adminListProductsPage({ q: term, page: 0, pageSize: 8 }, controller.signal)
        .then(({ products }) => {
          setFound({ term, products });
          setError(null);
        })
        .catch((err: unknown) => {
          if (!axios.isCancel(err)) setError(getApiErrorMessage(err, "Ürünler aranamadı."));
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchable, term]);

  // Clicking away hides the list without clearing the typed term.
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setDismissed(true);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const current = found?.term === term ? found.products : null;
  const results = searchable && !dismissed ? current : null;
  const searching = searchable && current === null;

  const add = (product: AdminProduct) => {
    setQuery("");
    if (full || product.id === excludeId || selected.some((c) => c.id === product.id)) return;
    onChange([...selected, cardOf(product)]);
  };

  const slots = [...selected, ...Array.from({ length: MAX_CROSS_SELLS - selected.length }, () => null)];

  return (
    <div>
      <div ref={box} className="relative max-w-md">
        <label htmlFor="cross-sell-search" className="sr-only">
          Birlikte satılacak ürün ara
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
          aria-hidden
        />
        <input
          id="cross-sell-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDismissed(false);
          }}
          disabled={full}
          placeholder={full ? `En fazla ${MAX_CROSS_SELLS} ürün seçilebilir` : "Ürün adı veya kodu ile ara…"}
          autoComplete="off"
          className={`${sheetInputClass} pl-9`}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden />
        )}

        {results !== null && (
          <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-zinc-900">
            {results.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-zinc-400">Sonuç yok.</li>
            ) : (
              results.map((product) => {
                const already = selected.some((c) => c.id === product.id) || product.id === excludeId;
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => add(product)}
                      disabled={already}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50 disabled:opacity-40 dark:hover:bg-white/5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{product.name}</span>
                        <span className="block truncate font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                          {product.base_code}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">
                        {already ? "Seçili" : "Ekle"}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((card, index) =>
          card ? (
            <li
              key={card.id}
              className="relative overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/15 dark:bg-zinc-900"
            >
              <button
                type="button"
                onClick={() => onChange(selected.filter((c) => c.id !== card.id))}
                aria-label={`${card.name} ürününü kaldır`}
                className="absolute right-1.5 top-1.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm ring-1 ring-inset ring-black/[0.08] transition-colors hover:bg-red-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500 dark:bg-zinc-800/90 dark:text-zinc-300 dark:ring-white/10"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
              <div className="aspect-square bg-white dark:bg-zinc-100">
                {card.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={card.image_url} alt="" className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[11px] text-slate-400">Görsel yok</span>
                )}
              </div>
              <div className="border-t border-slate-200 px-2 py-1.5 dark:border-white/10">
                <p className="truncate font-mono text-[10px] text-slate-500 dark:text-zinc-400">{card.base_code}</p>
                <p className="truncate text-xs font-medium" title={card.name}>
                  {card.name}
                </p>
                <p className="mt-0.5 font-mono text-xs tabular-nums">
                  {card.price_incl_tax ? formatMoney(card.price_incl_tax, card.currency ?? "TRY") : "—"}
                </p>
              </div>
            </li>
          ) : (
            <li
              key={`slot-${index}`}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 dark:border-white/15 dark:text-zinc-500"
            >
              <Plus className="h-5 w-5" aria-hidden />
              <span className="text-[11px] font-medium">Ürün Ekle</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
