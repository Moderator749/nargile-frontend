"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import { useCatalog } from "@/hooks/useCatalog";
import { FEATURED_PRODUCTS_COUNT } from "@/lib/config";
import { useAuthStore } from "@/store/useAuthStore";
import type { CatalogProduct, Category } from "@/types";

interface FeaturedProductsProps {
  category: Category;
  categories: Category[];
  /** Server-rendered anonymous products; null if the API was unreachable. */
  initialProducts: CatalogProduct[] | null;
}

/** Dealer-aware: logged-in visitors get their own segment prices, like the catalog. */
export function FeaturedProducts({ category, categories, initialProducts }: FeaturedProductsProps) {
  const user = useAuthStore((s) => s.user);
  const catalog = useCatalog({
    category: category.slug,
    query: "",
    initialProducts,
    pageSize: FEATURED_PRODUCTS_COUNT,
  });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // Nothing worth showing (API down and fetch failed, or an empty category).
  if (!catalog.loading && catalog.products.length === 0) return null;

  const items = catalog.loading
    ? Array.from({ length: 4 }, (_, i) => ({ key: `skeleton-${i}`, node: <ProductCardSkeleton /> }))
    : catalog.products.slice(0, FEATURED_PRODUCTS_COUNT).map((product) => ({
        key: product.id,
        node: (
          <ProductCard
            product={product}
            category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
            isLoggedIn={!!user}
            publicPrices={catalog.publicPrices}
            pricesPending={catalog.pricesPending}
          />
        ),
      }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <ProductRail
        id="featured-heading"
        eyebrow="Öne çıkanlar"
        title={category.name}
        busy={catalog.loading}
        items={items}
        action={
          <Link
            href={`/catalog/${category.slug}`}
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            Tümünü gör
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
              strokeWidth={1.5}
              aria-hidden
            />
          </Link>
        }
      />
    </div>
  );
}
