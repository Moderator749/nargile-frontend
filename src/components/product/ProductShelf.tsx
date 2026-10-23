"use client";

import type { ReactNode } from "react";

import { ProductCard } from "@/components/catalog/ProductCard";
import type { CatalogProduct, Category } from "@/types";

/**
 * A titled row of full-size product cards under the product ("Birlikte İyi
 * Gider", "Benzer Ürünler"): an <h2> section, each card's name its <h3>.
 *
 * Centred by a wrapping flex row, so one card sits in the middle of the page and
 * four fill it — a grid would leave one card hugging the left edge.
 */
export function ProductShelf({
  id,
  title,
  products,
  categories,
  isLoggedIn,
  pricesPending,
  footer,
}: {
  /** The heading's id, for the section's aria-labelledby. */
  id: string;
  title: string;
  products: CatalogProduct[];
  categories: Category[];
  isLoggedIn: boolean;
  /** The viewer's own prices are still on their way: show none rather than the public ones. */
  pricesPending: boolean;
  /** Under the cards: e.g. a link to the whole category. */
  footer?: ReactNode;
}) {
  if (products.length === 0) return null;
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return (
    <section aria-labelledby={id} className="mt-14 border-t border-border pt-10">
      <h2 id={id} className="text-center text-2xl font-semibold tracking-tighter text-foreground sm:text-3xl">
        {title}
      </h2>
      <ul className="mx-auto mt-8 flex flex-wrap justify-center gap-3 sm:gap-6">
        {products.map((product) => (
          // Two side by side on a phone; four of these fit one row on xl and wrap evenly below it.
          <li key={product.id} className="flex w-[calc(50%-0.375rem)] sm:w-[20rem] sm:max-w-sm xl:w-[17.5rem] [&>*]:flex-1">
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
      {footer && <div className="mt-8 flex justify-center">{footer}</div>}
    </section>
  );
}
