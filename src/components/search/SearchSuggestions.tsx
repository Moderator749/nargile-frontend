"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { ArrowRight, LayoutGrid, Package } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useT } from "@/components/i18n/LocaleProvider";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { fetchSuggestions } from "@/lib/catalogApi";
import { saleState } from "@/lib/flashSale";
import { canOptimiseImage } from "@/lib/home";
import { productHref, categoryHref } from "@/lib/seo";
import { displayVariant } from "@/lib/variants";
import type { CatalogProduct, SearchSuggestions as Suggestions } from "@/types";

/** Suggestions from the second letter: a shorter term matches half the catalogue. */
export const SUGGEST_FROM = 2;
/** Long enough to skip the letters of a word typed quickly. */
const DEBOUNCE_MS = 180;

/**
 * The suggestions for what has been typed so far, fetched once typing pauses:
 * null until there is something to show (or for under two letters), and the
 * last answer kept while the next one loads, so the list does not flicker.
 */
export function useSuggestions(query: string): { data: Suggestions | null; term: string } {
  const term = query.trim();
  const [found, setFound] = useState<{ term: string; data: Suggestions } | null>(null);
  useEffect(() => {
    if (term.length < SUGGEST_FROM) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchSuggestions(term, controller.signal)
        .then((data) => setFound({ term, data }))
        .catch((err: unknown) => {
          if (!axios.isCancel(err)) setFound(null);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);
  return { data: term.length >= SUGGEST_FROM ? (found?.data ?? null) : null, term: found?.term ?? term };
}

/** A product as a suggestion: its photo, name, code and the price its card shows. */
function ProductRow({ product, onPick }: { product: CatalogProduct; onPick: () => void }) {
  const money = useDisplayMoney();
  const variant = displayVariant(product);
  const sale = saleState(product, variant, null);
  const price = sale.kind === "live" ? sale.price : (variant?.price ?? variant?.list_price ?? null);
  const image = product.image_url;
  return (
    <li>
      <Link
        href={productHref(product)}
        onClick={onPick}
        className="flex min-h-14 items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none dark:hover:bg-white/[0.06] dark:focus-visible:bg-white/[0.06]"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-black/5">
          {image ? (
            <Image src={image} alt="" fill sizes="44px" unoptimized={!canOptimiseImage(image)} className="object-contain p-0.5" />
          ) : (
            <Package className="h-5 w-5 text-neutral-400" strokeWidth={1.5} aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{product.name}</span>
          <span className="block truncate font-mono text-xs text-muted-foreground">{product.base_code}</span>
        </span>
        {price && (
          <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">{money.format(price)}</span>
        )}
      </Link>
    </li>
  );
}

/**
 * The list under a search field: matching categories, the first products the
 * full search lists (as their cards price them), and "Tüm sonuçları gör (X)".
 * Matched as the search matches — Turkish letters folded, so "lule" finds the
 * Lüleler. `onPick` closes whatever holds it.
 */
export function SuggestionPanel({
  data,
  term,
  onPick,
  className = "",
}: {
  data: Suggestions;
  term: string;
  onPick: () => void;
  className?: string;
}) {
  const t = useT();
  const all = `/catalog?q=${encodeURIComponent(term)}`;
  return (
    <div className={className}>
      {data.categories.length > 0 && (
        <section aria-label={t.nav.searchCategories} className="border-b border-border px-2 pb-2">
          <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.nav.searchCategories}</p>
          <ul>
            {data.categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={categoryHref(c.slug)}
                  onClick={onPick}
                  className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-sm font-medium text-foreground transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none dark:hover:bg-white/[0.06] dark:focus-visible:bg-white/[0.06]"
                >
                  <LayoutGrid className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
                  <span className="truncate">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-label={t.nav.searchProducts} className="px-2 py-2">
        {data.products.length > 0 ? (
          <ul>
            {data.products.map((p) => (
              <ProductRow key={p.id} product={p} onPick={onPick} />
            ))}
          </ul>
        ) : (
          <p className="px-2 py-3 text-sm text-muted-foreground">{t.nav.searchNone}</p>
        )}
      </section>
      {data.total > 0 && (
        <Link
          href={all}
          onClick={onPick}
          className="flex min-h-12 items-center justify-center gap-2 border-t border-border text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none dark:text-red-400 dark:hover:bg-red-500/10"
        >
          {t.nav.searchAll(data.total)}
          <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </Link>
      )}
    </div>
  );
}
