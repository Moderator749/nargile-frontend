"use client";

import { FreeShippingPerk } from "@/components/home/FreeShippingPerk";
import { ProductRow } from "@/components/home/ProductRow";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category, HomePicks } from "@/types";

/**
 * "Sizin İçin Seçtiklerimiz": the products the admin picked in "Ana Sayfa
 * Düzenleme" (15–20, in their order), as one row of the catalog's own cards
 * that slides sideways, with the free-shipping van (`FreeShippingPerk`) at
 * the right. The automatic lists it once held behind tabs ("Çok Satanlar" /
 * "Yeni Gelenler") are their own section further down the page
 * (`FeaturedProductsShowcase`).
 *
 * Server-rendered at the public (retail) price; a signed-in visitor gets the
 * row re-priced for their own segment in one request (`useOwnPrices`).
 */
export function CuratedPicksShowcase({
  products,
  categories,
  copy,
}: {
  products: CatalogProduct[];
  categories: Category[];
  /** Its words, from "Ana Sayfa Düzenleme". */
  copy: HomePicks;
}) {
  const mine = useOwnPrices(products);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);

  if (products.length === 0) return null;
  return (
    // On a white band, the same white the supplier photos are shot on; the lüle
    // row continues the white below, so this one keeps less at its foot.
    <ProductRow
      headingId="sectiklerimiz-baslik"
      title={copy.title}
      subtitle={copy.subtitle}
      className="bg-white pt-8 pb-8 sm:pt-10 sm:pb-10 dark:bg-transparent"
      products={products}
      mine={mine}
      loggedIn={hydrated && !!token}
      categories={categories}
      actions={
        <FreeShippingPerk eyebrow={copy.shipping_eyebrow} text={copy.shipping_text} className="self-start xl:justify-self-end" />
      }
    />
  );
}
