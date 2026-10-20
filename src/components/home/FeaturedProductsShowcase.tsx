"use client";

import { useState } from "react";

import { FreeShippingPerk } from "@/components/home/FreeShippingPerk";
import { ProductRow } from "@/components/home/ProductRow";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

const TABS = [
  { key: "bestsellers", label: "Çok Satanlar" },
  { key: "newest", label: "Yeni Gelenler" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TAB =
  "rounded-full px-6 py-2.5 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-white";
const TAB_ACTIVE = "bg-gray-900 text-white dark:bg-white dark:text-gray-900";
const TAB_IDLE =
  "border border-gray-200 bg-white text-gray-700 hover:border-gray-900 dark:border-border dark:bg-transparent dark:text-neutral-300 dark:hover:border-white";

/**
 * "Sizin İçin Seçtiklerimiz": two lists behind a pair of tabs, each one row of
 * the catalog's own cards that slides sideways (`ProductRow`), "Lüle Alırken
 * Kararsız Kalacaksınız" (`LuleShowcase`) the same row under it. The tabs
 * follow the title; the free-shipping van (`FreeShippingPerk`) is at the right.
 *
 * The lists arrive server-rendered at the public (retail) price; a signed-in
 * visitor gets both re-priced for their own segment in one request
 * (`useOwnPrices`).
 */
export function FeaturedProductsShowcase({
  lists,
  categories,
}: {
  lists: Record<TabKey, CatalogProduct[]>;
  categories: Category[];
}) {
  const [tab, setTab] = useState<TabKey>("newest");
  const mine = useOwnPrices(TABS.flatMap(({ key }) => lists[key]));
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const loggedIn = hydrated && !!token;

  const visible = TABS.filter(({ key }) => lists[key].length > 0);
  if (visible.length === 0) return null;
  const active = lists[tab].length > 0 ? tab : visible[0].key;

  return (
    // On a white band in the light theme, the same white the supplier photos are
    // shot on, so each product stands on the page with no tile around it. The
    // lüle row continues the white below, so this one keeps less at its foot.
    <ProductRow
      headingId="sectiklerimiz-baslik"
      title="Sizin İçin Seçtiklerimiz"
      subtitle="En çok tercih edilen ve yeni gelen ürünler"
      className="bg-white pt-12 pb-8 sm:pt-16 sm:pb-10 dark:bg-transparent"
      products={lists[active]}
      mine={mine}
      loggedIn={loggedIn}
      categories={categories}
      // Title, then the tabs on its line, then the van at the right.
      actions={<FreeShippingPerk className="self-start xl:self-center" />}
      besideTitle={
        visible.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Ürün listesi">
            {visible.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={key === active}
                onClick={() => setTab(key)}
                className={`${TAB} ${key === active ? TAB_ACTIVE : TAB_IDLE}`}
              >
                {label}
              </button>
            ))}
          </div>
        )
      }
    />
  );
}
