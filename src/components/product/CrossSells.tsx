"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { BundleTotal, type BundleMain } from "@/components/product/BundleTotal";
import { ProductShelf } from "@/components/product/ProductShelf";
import { productMessages } from "@/lib/i18n/messages/product";
import type { CatalogProduct, Category } from "@/types";

/**
 * "Birlikte İyi Gider": the products the admin pinned to this one, as the same
 * full-size cards the catalogue and the homepage use.
 *
 * They arrive with the product and are priced for the same viewer, so a dealer
 * sees dealer prices here too, and nothing is shown while the viewer's own prices
 * are still loading rather than flashing the public ones. Under the cards, the
 * product and its extras added up, and put in the cart in one go (`BundleTotal`).
 */
export function CrossSells({
  products,
  categories,
  isLoggedIn,
  pricesPending,
  main,
}: {
  /** Absent in a cached payload from before cross-sells existed. */
  products: CatalogProduct[] | undefined;
  categories: Category[];
  isLoggedIn: boolean;
  pricesPending: boolean;
  /** The product itself, as its page has it: the chosen colour, at the price shown. */
  main: BundleMain;
}) {
  const t = useMessages(productMessages);
  return (
    <ProductShelf
      id="cross-sells-heading"
      title={t.crossSells}
      products={products ?? []}
      categories={categories}
      isLoggedIn={isLoggedIn}
      pricesPending={pricesPending}
      footer={
        pricesPending ? undefined : <BundleTotal main={main} extras={products ?? []} isLoggedIn={isLoggedIn} />
      }
    />
  );
}
