"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { ProductCard } from "@/components/catalog/ProductCard";
import { SectionHeader } from "@/components/home/SectionHeader";
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
 * Module 9: "Fırsat Ürünleri", as a grid of every live deal (four per row,
 * wrapping down) rather than a carousel — nothing hides off-screen.
 *
 * A card with a deadline counts down to it; at zero (or once the deal stock runs
 * out) it reads "Fırsat Kaçtı" and the regular price applies — checkout agrees at
 * the same moment. Logged-in visitors refetch so deals are priced against their
 * own segment.
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
  // Everything the admin has switched on, including deals that have been missed
  // (expired or out of deal stock) — those keep their place with a "Fırsat Kaçtı"
  // badge and their regular price.
  const deals = products.filter((p) => p.is_opportunity);
  if (deals.length === 0) return null;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return (
    <section
      id="firsat-urunleri"
      aria-labelledby="flash-heading"
      className="scroll-mt-[var(--header-height)] py-16 sm:py-20"
    >
      <SectionHeader id="flash-heading" eyebrow="Süre sınırlı" title="Fırsat Ürünleri" />
      {/* Every live deal at once: four per row, wrapping downwards. The wrapper
          divs stretch the cards so a row shares one height, as in the catalog. */}
      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {deals.map((product) => (
          <li key={product.id} className="flex">
            <div className="flex w-full flex-col [&>article]:flex-1">
              <ProductCard
                product={product}
                category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
                isLoggedIn={loggedIn}
                publicPrices={!mine}
                pricesPending={loggedIn && !mine}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
