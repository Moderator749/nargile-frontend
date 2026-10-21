"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { SearchX } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { AdminCatalogPdf, useIsAdmin } from "@/components/catalog/AdminCatalogPdf";
import { CatalogFilterBar } from "@/components/catalog/CatalogFilterBar";
import { PriceCatalogExport } from "@/components/catalog/PriceCatalogExport";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/Button";
import { useNow } from "@/hooks/useNow";
import { fetchFlashSaleProducts } from "@/lib/catalogApi";
import { EMPTY_FILTERS, applyCatalogFilters, priceBounds, type CatalogFilters } from "@/lib/catalogFilters";
import { isExportAccount } from "@/lib/exportAccount";
import { CATALOG_GRID } from "@/lib/layout";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { isB2BSegment } from "@/lib/priceList";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

/** The first row on a wide screen loads at once; the rest lazily. */
const EAGER_CARDS = 4;
/** A deal that can still be claimed in some colour — the funnel's own rule. */
const live = (p: CatalogProduct) => p.is_opportunity && p.variants.some((v) => v.flash_sale);

/**
 * "Fırsat Ürünleri" (/firsat-urunleri): every live deal as a catalog card, the
 * page the homepage funnel's "Fırsatları Gör" leads to — laid out as a catalog
 * page, with the catalog's toolbar (price range, stock, sort, the column's
 * switch and the PDF catalogue) over the catalog's grid.
 *
 * The deals arrive whole (at most FLASH_SALE_LIMIT), so the toolbar narrows
 * and orders all of them, by the price each card prints (`lib/catalogFilters`).
 *
 * Server-rendered at public (retail) prices; a signed-in visitor's own copies
 * replace them — their price and their own list's stock — and until they do,
 * or if they never arrive, the cards stay masked and unbuyable rather than
 * show the guest's.
 */
export function DealsGrid({
  initialProducts,
  categories,
}: {
  initialProducts: CatalogProduct[];
  categories: Category[];
}) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [own, setOwn] = useState<{ token: string; products: CatalogProduct[] | null } | null>(null);
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const isAdmin = useIsAdmin();
  const locale = useLocale();
  const messages = useMessages(catalogMessages);
  const t = messages.deals;
  /** The PDF catalogue's collection line. */
  const collection = t.collection;

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchFlashSaleProducts(controller.signal)
      .then((products) => setOwn({ token, products }))
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setOwn({ token, products: null });
      });
    return () => controller.abort();
  }, [hydrated, token]);

  const loggedIn = hydrated && !!token;
  const mine = own && own.token === token ? own.products : null;
  const pricesPending = loggedIn && !mine;
  const source = mine ?? initialProducts;
  const products = useMemo(() => source.filter(live), [source]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  // Bayi / Toptan / Kafe (not export) accounts get the PDF price catalogue, as on the catalog.
  const canExport = !!user && isB2BSegment(user.segment_code) && !isExportAccount(user);

  // Sales end while the page is open; the filters price what the cards price.
  const now = useNow(products.length > 0);
  const bounds = useMemo(() => priceBounds(products, now), [products, now]);
  const shown = useMemo(() => applyCatalogFilters(products, filters, now, locale), [products, filters, now, locale]);
  const patch = (next: Partial<CatalogFilters>) => setFilters((f) => ({ ...f, ...next }));

  return (
    <>
      <CatalogFilterBar
        value={filters}
        onChange={patch}
        bounds={bounds}
        // The deals as shown, as a PDF price catalogue: an admin's at any
        // group's prices, a Bayi / Toptan / Kafe account's at the ones below it.
        trailing={
          isAdmin ? (
            <AdminCatalogPdf products={shown} collection={collection} />
          ) : canExport ? (
            <PriceCatalogExport products={shown} collection={collection} hasMore={false} />
          ) : undefined
        }
      />

      {products.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-base font-semibold text-foreground">{t.none}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.noneHint}</p>
          <Link
            href="/catalog"
            className="mt-5 text-sm font-medium text-foreground underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
          >
            {t.browseAll}
          </Link>
        </div>
      ) : (
        <>
          <h2 className="mb-5 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            {t.count(shown.length)}
          </h2>
          {shown.length === 0 ? (
            // Deals behind the filters: say so, and offer the way back.
            <div className="flex flex-col items-center py-20 text-center">
              <SearchX className="h-10 w-10 text-slate-300 dark:text-zinc-700" strokeWidth={1.5} aria-hidden />
              <p className="mt-4 font-medium">{t.noMatchFilters}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{messages.grid.widenFilters}</p>
              <div className="mt-5 w-40">
                <Button type="button" variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                  {messages.grid.clearFilters}
                </Button>
              </div>
            </div>
          ) : (
            <ul className={CATALOG_GRID}>
              {shown.map((product, i) => (
                <li key={product.id} className="flex">
                  <div className="flex w-full flex-col [&>article]:flex-1">
                    <ProductCard
                      product={product}
                      eager={i < EAGER_CARDS}
                      category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
                      isLoggedIn={loggedIn}
                      publicPrices={!mine}
                      pricesPending={pricesPending}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
