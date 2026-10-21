"use client";

import type { ReactNode } from "react";

import { ProductRow } from "@/components/home/ProductRow";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

/**
 * One category as the homepage's standard product row ("Közlükler", "Oyun &
 * Eğlence"): on the white, a title over its line, the products sliding
 * sideways under them with the arrows and the way to the whole category —
 * the same row, cards and widths as "Lüle Alırken Kararsız Kalacaksınız".
 * Server-rendered at the public price, re-priced for a signed-in visitor.
 */
export function CategoryRow({
  headingId,
  title,
  subtitle,
  products,
  categories,
  more,
}: {
  headingId: string;
  title: string;
  subtitle: ReactNode;
  products: CatalogProduct[];
  categories: Category[];
  /** The category's page, for "Tümünü Gör". */
  more: { href: string; label: string };
}) {
  const mine = useOwnPrices(products);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);

  return (
    <ProductRow
      headingId={headingId}
      title={title}
      subtitle={subtitle}
      className="bg-white pt-8 pb-12 sm:pt-10 sm:pb-16 dark:bg-transparent"
      products={products}
      mine={mine}
      loggedIn={hydrated && !!token}
      categories={categories}
      accent
      more={more}
    />
  );
}
