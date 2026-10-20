"use client";

import { ProductRow } from "@/components/home/ProductRow";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

/**
 * "Lüle Alırken Kararsız Kalacaksınız": the Lüleler category as one sliding row, the same row
 * as "Sizin İçin Seçtiklerimiz" above it and on the same white band.
 * Server-rendered at the public price, re-priced for a signed-in visitor.
 */
export function LuleShowcase({ products, categories }: { products: CatalogProduct[]; categories: Category[] }) {
  const mine = useOwnPrices(products);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);

  return (
    <ProductRow
      headingId="luleler-baslik"
      title="Lüle Alırken Kararsız Kalacaksınız"
      subtitle="Müşterilerimizin favorisi, en şık ve göz alıcı tasarımlar"
      className="bg-white pt-8 pb-12 sm:pt-10 sm:pb-16 dark:bg-transparent"
      products={products}
      mine={mine}
      loggedIn={hydrated && !!token}
      categories={categories}
    />
  );
}
