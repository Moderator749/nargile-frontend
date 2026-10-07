"use client";

import { useState, type ReactNode } from "react";
import { SearchX } from "lucide-react";

import { CatalogSearch } from "@/components/catalog/CatalogSearch";
import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuthStore } from "@/store/useAuthStore";
import type { CatalogProduct, Category, SegmentType } from "@/types";

const SEGMENT_LABELS: Record<SegmentType, string> = {
  RETAIL: "Perakende",
  CAFE: "Kafe",
  WHOLESALE: "Toptan",
  DEALER: "Bayi",
};

const gridClass = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

interface CatalogViewProps {
  categories: Category[];
  activeCategory: Category | null;
  initialProducts: CatalogProduct[] | null;
  /** Server-rendered category tabs. */
  tabs: ReactNode;
}

export function CatalogView({ categories, activeCategory, initialProducts, tabs }: CatalogViewProps) {
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState("");
  const catalog = useCatalog({ category: activeCategory?.slug ?? null, query, initialProducts });
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const segment = user?.segment_code;

  const heading = query
    ? `“${query}” için sonuçlar`
    : activeCategory
      ? `${activeCategory.name} ürünleri`
      : "Tüm ürünler";

  return (
    <>
      <div className="sticky top-[var(--header-height)] z-30 border-b border-border bg-background/70 backdrop-blur-lg backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {tabs}
          <CatalogSearch
            onSearch={setQuery}
            busy={catalog.refreshing || (catalog.loading && query !== "")}
            placeholder={activeCategory ? `${activeCategory.name} içinde ara` : "Ürün, marka veya kod ara"}
          />
        </div>
      </div>

      <section aria-labelledby="products-heading" className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 id="products-heading" className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            {heading}
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
            {Array.from({ length: 6 }, (_, i) => (
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
        ) : catalog.products.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <SearchX className="h-10 w-10 text-slate-300 dark:text-zinc-700" strokeWidth={1.5} aria-hidden />
            <p className="mt-4 font-medium">{query ? "Aramanızla eşleşen ürün bulunamadı." : "Bu kategoride henüz ürün yok."}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              {query ? "Farklı bir kelime deneyin ya da tüm kategorilerde arayın." : "Yakında yeni ürünler eklenecek."}
            </p>
          </div>
        ) : (
          <>
            <ul
              className={`${gridClass} transition-opacity duration-200 ${catalog.refreshing ? "opacity-60" : ""}`}
              aria-busy={catalog.refreshing}
            >
              {catalog.products.map((product) => (
                <li key={product.id} className="flex">
                  <div className="flex w-full flex-col [&>article]:flex-1">
                    <ProductCard
                      product={product}
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
      </section>
    </>
  );
}
