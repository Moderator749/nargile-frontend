"use client";

import { useState } from "react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { PAGE_CONTAINER } from "@/lib/layout";
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
 * "Sizin İçin Seçtiklerimiz": two short lists behind a pair of tabs, in the
 * catalog's own cards (`ProductCard`: the frame, brand and code, add to cart).
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
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const visible = TABS.filter(({ key }) => lists[key].length > 0);
  if (visible.length === 0) return null;
  const active = lists[tab].length > 0 ? tab : visible[0].key;

  return (
    // On a white band in the light theme, the same white the supplier photos are
    // shot on, so each product stands on the page with no tile around it.
    <section aria-labelledby="sectiklerimiz-baslik" className="bg-white py-12 sm:py-16 dark:bg-transparent">
      {/* The page's gutters on the wrapper, so the header and the grid inside it
          line up with every other row. */}
      <div className={PAGE_CONTAINER}>
        <div className="mx-auto mb-8 flex w-full max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="sectiklerimiz-baslik"
              className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl dark:text-white"
            >
              Sizin İçin Seçtiklerimiz
            </h2>
            <p className="mt-2 text-gray-500 dark:text-neutral-400">En çok tercih edilen ve yeni gelen ürünler</p>
          </div>
          {visible.length > 1 && (
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
          )}
        </div>

        <ul className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-5">
          {lists[active].map((listed) => {
            // A signed-in visitor's own copy, once it is in; its price is theirs.
            const product = mine?.get(listed.id) ?? listed;
            return (
              <li key={product.id} className="flex">
                <div className="flex w-full flex-col [&>article]:flex-1">
                  <ProductCard
                    product={product}
                    category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
                    isLoggedIn={loggedIn}
                    publicPrices={!mine}
                    pricesPending={loggedIn && !mine}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
