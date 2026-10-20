"use client";

import { CourierPerks } from "@/components/home/CourierPerks";
import { ProductRow } from "@/components/home/ProductRow";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

/**
 * "Lüle Alırken Kararsız Kalacaksınız": the Lüleler category as one sliding
 * row of products, the same row as "Sizin İçin Seçtiklerimiz" above it, on a
 * band of its own: a warm coral and rose mesh that drifts, standing off the
 * white page as the SultanPuan band does (in gold, after it). The shipping
 * perks sit in its header, beside the title, with the courier driving
 * (`CourierPerks`); the cards are the livelier ones (`elevated`).
 * Server-rendered at the public price, re-priced for a signed-in visitor.
 */
export function LuleShowcase({
  products,
  categories,
}: {
  products: CatalogProduct[];
  categories: Category[];
}) {
  const mine = useOwnPrices(products);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);

  return (
    <ProductRow
      headingId="luleler-baslik"
      title="Lüle Alırken Kararsız Kalacaksınız"
      subtitle="Müşterilerimizin favorisi, en şık ve göz alıcı tasarımlar"
      className="relative isolate overflow-hidden bg-gradient-to-b from-rose-50 via-orange-50/70 to-white py-12 sm:py-16 dark:from-red-500/[0.09] dark:via-orange-500/[0.04] dark:to-transparent"
      decoration={
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {/* The mesh: coral at the top left, rose at the right, a warm
              amber low in the middle, each drifting. */}
          <div className="absolute -left-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-red-300/35 blur-[120px] motion-safe:animate-glow-drift dark:bg-red-500/15" />
          <div className="absolute -right-24 top-6 h-[26rem] w-[26rem] rounded-full bg-rose-300/30 blur-[110px] motion-safe:animate-glow-drift [animation-delay:-5s] dark:bg-rose-500/10" />
          <div className="absolute bottom-0 left-1/3 h-72 w-[36rem] rounded-full bg-amber-200/35 blur-[110px] motion-safe:animate-glow-drift [animation-delay:-9s] dark:bg-amber-500/10" />
          {/* A fine dot grid, fading toward the edges, so the warmth reads as a surface. */}
          <div className="absolute inset-0 bg-[radial-gradient(rgb(190_18_60/0.12)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)] dark:bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)]" />
        </div>
      }
      actions={<CourierPerks />}
      products={products}
      mine={mine}
      loggedIn={hydrated && !!token}
      categories={categories}
      elevated
    />
  );
}
