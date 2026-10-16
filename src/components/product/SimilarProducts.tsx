"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ChevronRight } from "lucide-react";

import { ProductShelf } from "@/components/product/ProductShelf";
import { fetchProductsByIds } from "@/lib/catalogApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

/**
 * "Benzer Ürünler": products from the same category (chosen on the server, see
 * lib/related), linked from every product page so the whole category is
 * reachable from any one of its products.
 *
 * Server-rendered with the public prices — the links are what crawlers need —
 * and re-priced for a signed-in viewer, whose own prices replace them (none
 * are shown while those are on their way, as on the product itself).
 */
export function SimilarProducts({
  products,
  categories,
  category,
}: {
  products: CatalogProduct[];
  categories: Category[];
  category: Category;
}) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [own, setOwn] = useState<{ token: string; products: CatalogProduct[] } | null>(null);

  useEffect(() => {
    if (!hydrated || !token || products.length === 0) return;
    const controller = new AbortController();
    fetchProductsByIds(
      products.map((p) => p.id),
      controller.signal,
    )
      .then((priced) => {
        const byId = new Map(priced.map((p) => [p.id, p]));
        // The server's order, and only what is still on sale.
        setOwn({ token, products: products.flatMap((p) => byId.get(p.id) ?? []) });
      })
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setOwn({ token, products });
      });
    return () => controller.abort();
  }, [hydrated, token, products]);

  const loggedIn = hydrated && !!token;
  const mine = own && own.token === token ? own.products : null;

  return (
    <ProductShelf
      id="similar-products-heading"
      title="Benzer Ürünler"
      products={mine ?? products}
      categories={categories}
      isLoggedIn={loggedIn}
      pricesPending={loggedIn && !mine}
      footer={
        <Link
          href={`/catalog/${category.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
        >
          Tüm {category.name} ürünleri
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      }
    />
  );
}
