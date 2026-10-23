"use client";

import { useState } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { BundleCheck } from "@/components/product/BundleCheck";
import { BundleTotal, bundleable, type BundleMain } from "@/components/product/BundleTotal";
import { ProductShelf } from "@/components/product/ProductShelf";
import { productMessages } from "@/lib/i18n/messages/product";
import type { CatalogProduct, Category } from "@/types";

/**
 * "Birlikte İyi Gider": the products the admin pinned to this one, as the same
 * full-size cards the catalogue and the homepage use.
 *
 * They arrive with the product and are priced for the same viewer, so a dealer
 * sees dealer prices here too, and nothing is shown while the viewer's own prices
 * are still loading rather than flashing the public ones. Under each card that
 * can go in the cart, a tick says whether it is part of the set (all ticked to
 * begin with); under the cards, the ticked ones added up and put in the cart in
 * one go (`BundleTotal`).
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
  const messages = useMessages(productMessages);
  const t = messages.bundle;
  const extras = products ?? [];
  // The ones taken out, so a product is in the set until the visitor says otherwise.
  const [left, setLeft] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (id: string) =>
    setLeft((was) => {
      const next = new Set(was);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <ProductShelf
      id="cross-sells-heading"
      title={messages.crossSells}
      products={extras}
      categories={categories}
      isLoggedIn={isLoggedIn}
      pricesPending={pricesPending}
      itemFooter={
        pricesPending
          ? undefined
          : (product) =>
              bundleable(product) ? (
                <BundleCheck
                  checked={!left.has(product.id)}
                  onToggle={() => toggle(product.id)}
                  label={t.include}
                  ariaLabel={t.includeFor(product.name)}
                />
              ) : null
      }
      footer={
        pricesPending ? undefined : (
          <BundleTotal
            main={main}
            extras={extras.filter((p) => !left.has(p.id))}
            offered={extras.filter(bundleable).length}
            isLoggedIn={isLoggedIn}
          />
        )
      }
    />
  );
}
