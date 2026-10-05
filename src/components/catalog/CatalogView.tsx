"use client";

import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuthStore } from "@/store/useAuthStore";
import type { SegmentType } from "@/types";

const SEGMENT_LABELS: Record<SegmentType, string> = {
  RETAIL: "Perakende",
  CAFE: "Kafe",
  WHOLESALE: "Toptan",
  DEALER: "Bayi",
};

const gridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3";

export function CatalogView() {
  const user = useAuthStore((s) => s.user);
  const { products, loading, error, hasMore, loadingMore, loadMore, retry } = useCatalog();
  const segment = user?.segment_code;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Katalog</h1>
          <p className="mt-1 text-sm text-slate-500">Fiyatlara KDV dahildir.</p>
        </div>
        {segment && segment !== "RETAIL" && (
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {SEGMENT_LABELS[segment]} fiyatları gösteriliyor
          </span>
        )}
      </header>

      {loading ? (
        <div className={gridClass} aria-busy>
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 && error ? (
        <div className="mx-auto max-w-md space-y-3">
          <Alert variant="error">{error}</Alert>
          <Button type="button" onClick={retry}>
            Tekrar dene
          </Button>
        </div>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-slate-500">Henüz ürün bulunmuyor.</p>
      ) : (
        <>
          <div className={gridClass}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} isLoggedIn={!!user} />
            ))}
          </div>

          {error && (
            <div className="mx-auto mt-6 max-w-md">
              <Alert variant="error">{error}</Alert>
            </div>
          )}
          {hasMore && (
            <div className="mx-auto mt-8 max-w-xs">
              <Button
                type="button"
                onClick={loadMore}
                loading={loadingMore}
                variant="secondary"
              >
                Daha fazla ürün göster
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
