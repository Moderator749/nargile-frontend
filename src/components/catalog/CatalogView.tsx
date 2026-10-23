"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AdminCatalogPdf, useIsAdmin } from "@/components/catalog/AdminCatalogPdf";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { PriceCatalogExport } from "@/components/catalog/PriceCatalogExport";
import { isExportAccount } from "@/lib/exportAccount";
import { isB2BSegment } from "@/lib/priceList";
import { CatalogFilterBar } from "@/components/catalog/CatalogFilterBar";
import { useCatalogDensity } from "@/lib/catalogView";
import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useCatalog } from "@/hooks/useCatalog";
import { useNow } from "@/hooks/useNow";
import {
  EMPTY_FILTERS,
  applyCatalogFilters,
  priceBounds,
  type CatalogFilters,
} from "@/lib/catalogFilters";
import { filtersFromParams, filtersToParams } from "@/lib/catalogFilterParams";
import { publishSearchCount } from "@/lib/searchCount";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { useAuthStore } from "@/store/useAuthStore";
import type { CatalogProduct, Category } from "@/types";
import { CATALOG_GRID, PAGE_CONTAINER } from "@/lib/layout";

/** Cards whose photos load eagerly: the first row at the widest grid. */
const EAGER_CARDS = 4;

const gridClass = CATALOG_GRID;

interface CatalogViewProps {
  categories: Category[];
  activeCategory: Category | null;
  initialProducts: CatalogProduct[] | null;
  /** The category's name and its trail, server-rendered. */
  heading: ReactNode;
  /**
   * A brand page: the grid is this brand's search, whatever the URL says, and
   * `initialProducts` are its server-rendered first page.
   */
  brand?: { name: string; searchTerm: string };
  /** The always-open category column, beside the grid from `lg` up. */
  sidebar?: ReactNode;
}

/**
 * The catalog's search term lives in the URL, not in a field on this page.
 *
 * The dock has no search box — the header's one, and the brand rows in the
 * category column, both navigate to `?q=…` — but the term still has to reach
 * the grid. Reading it needs a Suspense boundary on a statically rendered
 * page, and the fallback renders the very same grid with no term, so the
 * products are in the prerendered HTML rather than waiting on hydration.
 */
export function CatalogView(props: CatalogViewProps) {
  // The page's frame, heading (its one <h1>) and category column stay outside
  // the boundary: a streamed boundary sends its fallback and its content both,
  // and either copy of the heading would otherwise be a second <h1>.
  // The bottom space belongs to whatever follows the grid — the closing
  // paragraphs' own padding (SeoIntro) — so this row keeps only enough to
  // clear its own cards.
  return (
    <section className={`${PAGE_CONTAINER} flex-1 pb-2 pt-4 sm:pt-6`}>
      <div className="lg:flex lg:items-start">
        {/* Kategoriler, beside the grid and open at all times. */}
        {props.sidebar}

        <div className="min-w-0 flex-1">
          {props.heading}
          {/* A brand page's term is fixed by the route; its filters are in the URL all the same. */}
          <Suspense fallback={<CatalogGrid {...props} query={props.brand?.searchTerm ?? ""} initialFilters={EMPTY_FILTERS} />}>
            <CatalogGridFromUrl {...props} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function CatalogGridFromUrl(props: CatalogViewProps) {
  const params = useSearchParams();
  const query = props.brand ? props.brand.searchTerm : (params.get("q") ?? "").trim();
  // Keyed on the term: a new search starts the grid over. The filters it
  // opens with are the address's (a reload, the back button, a shared link).
  return <CatalogGrid key={query} {...props} query={query} initialFilters={filtersFromParams(params)} />;
}

function CatalogGrid({
  categories,
  activeCategory,
  initialProducts,
  brand,
  query,
  initialFilters,
}: CatalogViewProps & { query: string; initialFilters: CatalogFilters }) {
  const user = useAuthStore((s) => s.user);
  const locale = useLocale();
  const t = useMessages(catalogMessages).grid;
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const catalog = useCatalog({
    category: activeCategory?.slug ?? null,
    query,
    initialProducts,
    seedQuery: brand?.searchTerm ?? "",
  });
  // A visitor's own search, as opposed to the brand page's built-in one.
  const searched = query && !brand ? query : "";
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const segment = user?.segment_code;
  // Bayi / Toptan / Kafe (not export) accounts get the PDF price catalogue.
  const canExport = !!user && isB2BSegment(segment) && !isExportAccount(user);
  const isAdmin = useIsAdmin();

  // Sales expire while the page is open; the filters price what the cards price.
  const now = useNow(catalog.products.some((p) => p.variants.some((v) => v.flash_sale)));
  const bounds = useMemo(() => priceBounds(catalog.products, now), [catalog.products, now]);
  const shown = useMemo(
    () => applyCatalogFilters(catalog.products, filters, now, locale),
    [catalog.products, filters, now, locale],
  );
  // The page's heading names the search with what it found ("‘lule’ için 48 sonuç").
  useEffect(() => {
    if (!searched) return;
    publishSearchCount(catalog.loading ? null : { query: searched, count: shown.length, more: catalog.hasMore });
  }, [searched, catalog.loading, shown.length, catalog.hasMore]);
  // A filter can empty a grid that has products behind it: say which it was.
  const filtered = shown.length === 0 && catalog.products.length > 0;

  // Written into the address as they change — replaced, not pushed, so the back
  // button leaves the catalog rather than stepping through every keystroke —
  // without asking the server for anything: the grid filters on its own.
  const apply = (next: CatalogFilters) => {
    setFilters(next);
    const params = filtersToParams(next, new URLSearchParams(window.location.search));
    const search = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
  };
  const patch = (next: Partial<CatalogFilters>) => apply({ ...filters, ...next });
  // A phone's two-or-one choice (the filter bar's switch); wider screens keep their columns.
  const density = useCatalogDensity();
  const grid = `${gridClass} ${density === "one" ? "max-md:grid-cols-1" : ""}`;
  const collection = brand ? brand.name : searched ? t.searchCollection(searched) : (activeCategory?.name ?? t.allProducts);

  return (
    <>
      <CatalogFilterBar
        value={filters}
        onChange={patch}
        bounds={bounds}
        // The grid as shown, as a PDF price catalogue: an admin's at any
        // group's prices, a Bayi / Toptan / Kafe account's at the ones below it.
        trailing={
          isAdmin ? (
            <AdminCatalogPdf products={shown} collection={collection} hasMore={catalog.hasMore} />
          ) : canExport ? (
            <PriceCatalogExport products={shown} collection={collection} hasMore={catalog.hasMore} />
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="products-heading" className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          {catalog.loading ? t.loading : searched ? t.countFor(searched, shown.length) : t.count(shown.length)}
        </h2>
        {segment && segment !== "RETAIL" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
            {t.segmentPrices(segment)}
          </span>
        )}
      </div>

      {catalog.loading ? (
        <div className={grid} aria-busy aria-label={t.loading}>
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : catalog.products.length === 0 && catalog.error ? (
        <div className="mx-auto max-w-md space-y-3 py-10">
          <Alert variant="error">{catalog.error}</Alert>
          <Button type="button" onClick={catalog.retry}>
            {t.retry}
          </Button>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <SearchX className="h-10 w-10 text-slate-300 dark:text-zinc-700" strokeWidth={1.5} aria-hidden />
          <p className="mt-4 font-medium">
            {filtered
              ? t.noMatchFilters
              : searched
                ? t.noMatchSearch
                : brand
                  ? t.brandEmpty(brand.name)
                  : t.categoryEmpty}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            {filtered ? t.widenFilters : searched ? t.trySearch : t.comingSoon}
          </p>
          {filtered && (
            <div className="mt-5 w-40">
              <Button type="button" variant="secondary" onClick={() => apply(EMPTY_FILTERS)}>
                {t.clearFilters}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <ul
            className={`${grid} transition-opacity duration-200 ${catalog.refreshing ? "opacity-60" : ""}`}
            aria-busy={catalog.refreshing}
          >
            {shown.map((product, i) => (
              <li key={product.id} className="flex">
                <div className="flex w-full flex-col [&>article]:flex-1">
                  <ProductCard
                    product={product}
                    // The first row on a wide screen; the rest load lazily.
                    eager={i < EAGER_CARDS}
                    category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
                    isLoggedIn={!!user}
                    publicPrices={catalog.publicPrices}
                    pricesPending={catalog.pricesPending}
                  />
                </div>
              </li>
            ))}
          </ul>

          {catalog.error && (
            <div className="mx-auto mt-8 max-w-md">
              <Alert variant="error">{catalog.error}</Alert>
            </div>
          )}
          {catalog.hasMore && (
            <div className="mx-auto mt-10 max-w-xs">
              <Button type="button" variant="secondary" onClick={catalog.loadMore} loading={catalog.loadingMore}>
                {t.loadMore}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
