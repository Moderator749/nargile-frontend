"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronRight } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { ProductShelf } from "@/components/product/ProductShelf";
import { fetchProductsByIds } from "@/lib/catalogApi";
import { productMessages } from "@/lib/i18n/messages/product";
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
  const t = useMessages(productMessages);
  const [own, setOwn] = useState<{ token: string; products: CatalogProduct[] | null } | null>(null);

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
        // Not the guest's copies: their stock is the Perakende quota. The shelf
        // stays masked, its buttons off, as while it loads.
        if (!axios.isCancel(err)) setOwn({ token, products: null });
      });
    return () => controller.abort();
  }, [hydrated, token, products]);

  const loggedIn = hydrated && !!token;
  const mine = own && own.token === token ? own.products : null;

  return (
    <ProductShelf
      id="similar-products-heading"
      title={t.similar}
      products={mine ?? products}
      categories={categories}
      isLoggedIn={loggedIn}
      pricesPending={loggedIn && !mine}
      footer={
        <Link
          href={`/catalog/${category.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
        >
          {t.allInCategory(category.name)}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Link>
      }
    />
  );
}
