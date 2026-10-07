"use client";

import { ProductCard } from "@/components/catalog/ProductCard";
import type { CatalogProduct, Category } from "@/types";

/**
 * "Birlikte İyi Gider": the products the admin pinned to this one, as the same
 * full-size cards the catalogue and the homepage use.
 *
 * They arrive with the product and are priced for the same viewer, so a dealer
 * sees dealer prices here too, and nothing is shown while the viewer's own prices
 * are still loading rather than flashing the public ones.
 *
 * Centred by a wrapping flex row, so one card sits in the middle of the page and
 * four fill it — a grid would leave one card hugging the left edge.
 */
export function CrossSells({
  products,
  categories,
  isLoggedIn,
  pricesPending,
}: {
  /** Absent in a cached payload from before cross-sells existed. */
  products: CatalogProduct[] | undefined;
  categories: Category[];
  isLoggedIn: boolean;
  pricesPending: boolean;
}) {
  const pinned = products ?? [];
  if (pinned.length === 0) return null;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return (
    <section aria-labelledby="cross-sells-heading" className="mt-14 border-t border-border pt-10">
      <h2
        id="cross-sells-heading"
        className="text-center text-2xl font-semibold tracking-tighter text-foreground sm:text-3xl"
      >
        Birlikte İyi Gider
      </h2>
      <ul className="mx-auto mt-8 flex flex-wrap justify-center gap-6">
        {pinned.map((product) => (
          // Four of these fit one row on xl and wrap evenly below it.
          <li key={product.id} className="flex w-full max-w-sm sm:w-[20rem] xl:w-[17.5rem] [&>*]:flex-1">
            <ProductCard
              product={product}
              category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
              isLoggedIn={isLoggedIn}
              publicPrices={pricesPending}
              pricesPending={pricesPending}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
