"use client";

import { BundleTotal } from "@/components/product/BundleTotal";
import { ProductShelf } from "@/components/product/ProductShelf";
import type { CatalogPrice, CatalogProduct, Category } from "@/types";

/**
 * "Birlikte İyi Gider": the products the admin pinned to this one, as the same
 * full-size cards the catalogue and the homepage use.
 *
 * They arrive with the product and are priced for the same viewer, so a dealer
 * sees dealer prices here too, and nothing is shown while the viewer's own prices
 * are still loading rather than flashing the public ones. Under the cards, the
 * product and its extras added up (`BundleTotal`).
 */
export function CrossSells({
  products,
  categories,
  isLoggedIn,
  pricesPending,
  mainPrice,
}: {
  /** Absent in a cached payload from before cross-sells existed. */
  products: CatalogProduct[] | undefined;
  categories: Category[];
  isLoggedIn: boolean;
  pricesPending: boolean;
  /** The product's own price as its page shows it (the chosen colour, a live sale's). */
  mainPrice: CatalogPrice | null;
}) {
  return (
    <ProductShelf
      id="cross-sells-heading"
      title="Birlikte İyi Gider"
      products={products ?? []}
      categories={categories}
      isLoggedIn={isLoggedIn}
      pricesPending={pricesPending}
      footer={pricesPending ? undefined : <BundleTotal main={mainPrice} extras={products ?? []} />}
    />
  );
}
