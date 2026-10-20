"use client";

import { CourierPerks } from "@/components/home/CourierPerks";
import { ProductRow } from "@/components/home/ProductRow";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

/**
 * "Lüle Alırken Kararsız Kalacaksınız": the Lüleler category as one sliding
 * row of products, the same row as "Sizin İçin Seçtiklerimiz" above it and
 * on the same white. The courier perk sits in its header, beside the title,
 * with the courier driving (`CourierPerks`); the cards are the livelier ones
 * (`elevated`).
 * Server-rendered at the public price, re-priced for a signed-in visitor.
 */
export function LuleShowcase({
  products,
  categories,
  categoryHref,
}: {
  products: CatalogProduct[];
  categories: Category[];
  /** The Lüleler category's page, for "Tüm Lüleleri Gör". */
  categoryHref: string;
}) {
  const mine = useOwnPrices(products);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);

  return (
    <ProductRow
      headingId="luleler-baslik"
      title="Lüle Alırken Kararsız Kalacaksınız"
      subtitle="Müşterilerimizin favorisi, en şık ve göz alıcı tasarımlar"
      // The picks row's white, continued: the two read as a pair.
      className="bg-white pt-8 pb-12 sm:pt-10 sm:pb-16 dark:bg-transparent"
      actions={<CourierPerks />}
      products={products}
      mine={mine}
      loggedIn={hydrated && !!token}
      categories={categories}
      elevated
      more={{ href: categoryHref, label: "Tüm Lüleleri Gör" }}
    />
  );
}
