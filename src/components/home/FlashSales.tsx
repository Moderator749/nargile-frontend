"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import { fetchFlashSaleProducts } from "@/lib/catalogApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

interface FlashSalesProps {
  /** Server-rendered anonymous (RETAIL) sales; null if the API was unreachable. */
  initialProducts: CatalogProduct[] | null;
  categories: Category[];
}

/**
 * Module 9: "Fırsat Ürünleri". Each card counts down to its sale's end; at zero it
 * shows "Zaman Doldu" and the regular price (checkout reverts at the same moment).
 * Logged-in visitors refetch so sales are priced against their own segment.
 */
export function FlashSales({ initialProducts, categories }: FlashSalesProps) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [own, setOwn] = useState<{ token: string; products: CatalogProduct[] } | null>(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchFlashSaleProducts(controller.signal)
      .then((products) => setOwn({ token, products }))
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setOwn({ token, products: initialProducts ?? [] });
      });
    return () => controller.abort();
  }, [hydrated, token, initialProducts]);

  const mine = own && own.token === token ? own.products : null;
  const loggedIn = hydrated && !!token;
  const products = (loggedIn ? (mine ?? initialProducts) : initialProducts) ?? [];
  // A segment price can already beat the sale: such products aren't deals for this viewer.
  const deals = products.filter((p) => p.variants[0]?.flash_sale);
  if (deals.length === 0) return null;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return (
    <div id="firsat-urunleri" className="scroll-mt-[var(--header-height)] py-16 sm:py-20">
      <ProductRail
        id="flash-heading"
        eyebrow="Süre sınırlı"
        title="Fırsat Ürünleri"
        items={deals.map((product) => ({
          key: product.id,
          node: (
            <ProductCard
              product={product}
              category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
              isLoggedIn={loggedIn}
              publicPrices={!mine}
              pricesPending={loggedIn && !mine}
            />
          ),
        }))}
      />
    </div>
  );
}
