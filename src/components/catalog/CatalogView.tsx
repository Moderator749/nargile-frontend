"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { PriceCatalogExport } from "@/components/catalog/PriceCatalogExport";
import { isExportAccount } from "@/lib/exportAccount";
import { isB2BSegment } from "@/lib/priceList";
import { CatalogFilterBar } from "@/components/catalog/CatalogFilterBar";
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
import { useAuthStore } from "@/store/useAuthStore";
import type { CatalogProduct, Category, SegmentType } from "@/types";
import { PAGE_CONTAINER } from "@/lib/layout";

const SEGMENT_LABELS: Record<SegmentType, string> = {
  RETAIL: "Perakende",
  CAFE: "Kafe",
  WHOLESALE: "Toptan",
  DEALER: "Bayi",
};

/** Cards whose photos load eagerly: the first row at the widest grid. */
const EAGER_CARDS = 4;

const gridClass = "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4";

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
  // The bottom space belongs to whatever follows the grid — the advantages
  // section does — so this row keeps only enough to clear its own cards.
  return (
    <section className={`${PAGE_CONTAINER} flex-1 pb-2 pt-4 sm:pt-6`}>
      <div className="lg:flex lg:items-start">
        {/* Kategoriler, beside the grid and open at all times. */}
        {props.sidebar}

        <div className="min-w-0 flex-1">
          {props.heading}
          {props.brand ? (
            // A brand page's term is fixed by the route, so there is no URL to wait for.
            <CatalogGrid {...props} query={props.brand.searchTerm} />
          ) : (
            <Suspense fallback={<CatalogGrid {...props} query="" />}>
              <CatalogGridFromUrl {...props} />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
}

function CatalogGridFromUrl(props: CatalogViewProps) {
  const query = (useSearchParams().get("q") ?? "").trim();
  // Keyed on the term: a new search starts the grid over, filters included.
  return <CatalogGrid key={query} {...props} query={query} />;
}

function CatalogGrid({
  categories,
  activeCategory,
  initialProducts,
  brand,
  query,
}: CatalogViewProps & { query: string }) {
  const user = useAuthStore((s) => s.user);
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
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

  // Sales expire while the page is open; the filters price what the cards price.
  const now = useNow(catalog.products.some((p) => p.variants.some((v) => v.flash_sale)));
  const bounds = useMemo(() => priceBounds(catalog.products, now), [catalog.products, now]);
  const shown = useMemo(
    () => applyCatalogFilters(catalog.products, filters, now),
    [catalog.products, filters, now],
  );
  // A filter can empty a grid that has products behind it: say which it was.
  const filtered = shown.length === 0 && catalog.products.length > 0;

  const patch = (next: Partial<CatalogFilters>) => setFilters((f) => ({ ...f, ...next }));

  return (
    <>
      <CatalogFilterBar
        value={filters}
        onChange={patch}
        bounds={bounds}
        // Bayi / Toptan / Kafe only: the grid as shown, as a PDF price catalogue.
        trailing={
          canExport ? (
            <PriceCatalogExport
              products={shown}
              collection={
                brand ? brand.name : searched ? `“${searched}” araması` : (activeCategory?.name ?? "Tüm ürünler")
              }
              hasMore={catalog.hasMore}
            />
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="products-heading" className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          {catalog.loading
            ? "Ürünler yükleniyor"
            : searched
              ? `“${searched}” için ${shown.length} ürün`
              : `${shown.length} ürün`}
        </h2>
        {segment && segment !== "RETAIL" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
            {SEGMENT_LABELS[segment]} fiyatları gösteriliyor
          </span>
        )}
      </div>

      {catalog.loading ? (
        <div className={gridClass} aria-busy aria-label="Ürünler yükleniyor">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : catalog.products.length === 0 && catalog.error ? (
        <div className="mx-auto max-w-md space-y-3 py-10">
          <Alert variant="error">{catalog.error}</Alert>
          <Button type="button" onClick={catalog.retry}>
            Tekrar dene
          </Button>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <SearchX className="h-10 w-10 text-slate-300 dark:text-zinc-700" strokeWidth={1.5} aria-hidden />
          <p className="mt-4 font-medium">
            {filtered
              ? "Seçtiğiniz filtrelere uyan ürün yok."
              : searched
                ? "Aramanızla eşleşen ürün bulunamadı."
                : brand
                  ? `${brand.name} ürünleri şu an satışta değil.`
                  : "Bu kategoride henüz ürün bulunmamaktadır."}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            {filtered
              ? "Fiyat aralığını genişletin ya da stok filtresini kaldırın."
              : searched
                ? "Farklı bir kelime deneyin ya da tüm kategorilerde arayın."
                : "Yakında yeni ürünler eklenecek."}
          </p>
          {filtered && (
            <div className="mt-5 w-40">
              <Button type="button" variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                Filtreleri temizle
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <ul
            className={`${gridClass} transition-opacity duration-200 ${catalog.refreshing ? "opacity-60" : ""}`}
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
                Daha fazla ürün göster
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
