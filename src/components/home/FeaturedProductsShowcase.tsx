"use client";

import { useState } from "react";

import { ProductRow } from "@/components/home/ProductRow";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { homeMessages } from "@/lib/i18n/messages/home";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category, HomePicks } from "@/types";

/** The tabs, in order; each one's label is its key in the copy (`bestsellers`). */
const TABS = [{ key: "bestsellers" }, { key: "newest" }] as const;

type TabKey = (typeof TABS)[number]["key"];

/** The two tabs share one slim track; the chosen one is filled. */
const TABS_TRACK =
  "inline-flex items-center gap-0.5 rounded-full bg-gray-100 p-1 ring-1 ring-inset ring-gray-200/80 dark:bg-white/[0.06] dark:ring-white/10";
const TAB =
  "rounded-full px-3.5 py-1 text-[13px] font-medium leading-5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-white";
const TAB_ACTIVE = "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900";
const TAB_IDLE = "text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white";

/**
 * "Çok Satanlar & Yeni Gelenler": two automatic lists behind a pair of tabs,
 * each one row of the catalog's own cards that slides sideways (`ProductRow`),
 * straight over the deals. Once "Sizin İçin Seçtiklerimiz" itself, which is
 * now the admin's own picks (`CuratedPicksShowcase`) and keeps the
 * free-shipping van. The tabs follow the title.
 *
 * The lists arrive server-rendered at the public (retail) price; a signed-in
 * visitor gets both re-priced for their own segment in one request
 * (`useOwnPrices`).
 */
export function FeaturedProductsShowcase({
  lists,
  categories,
  copy,
}: {
  lists: Record<TabKey, CatalogProduct[]>;
  categories: Category[];
  /** Its words, from "Ana Sayfa Düzenleme". */
  copy: HomePicks;
}) {
  const [tab, setTab] = useState<TabKey>("newest");
  const t = useMessages(homeMessages);
  const mine = useOwnPrices(TABS.flatMap(({ key }) => lists[key]));
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const loggedIn = hydrated && !!token;

  const visible = TABS.filter(({ key }) => lists[key].length > 0);
  if (visible.length === 0) return null;
  const active = lists[tab].length > 0 ? tab : visible[0].key;

  return (
    // On a white band in the light theme, the same white the supplier photos are
    // shot on, so each product stands on the page with no tile around it.
    <ProductRow
      headingId="cok-satanlar-baslik"
      // Cleared in the panel: the tabs' own names say what the section is.
      title={copy.tabs_title || `${copy.bestsellers} & ${copy.newest}`}
      subtitle={copy.tabs_subtitle}
      className="bg-white pt-8 pb-8 sm:pt-10 sm:pb-10 dark:bg-transparent"
      products={lists[active]}
      mine={mine}
      loggedIn={loggedIn}
      categories={categories}
      // Title at the left, the tabs beside it.
      besideTitle={
        visible.length > 1 && (
          <div className={TABS_TRACK} role="group" aria-label={t.picks.tabs}>
            {visible.map(({ key }) => (
              <button
                key={key}
                type="button"
                aria-pressed={key === active}
                onClick={() => setTab(key)}
                className={`${TAB} ${key === active ? TAB_ACTIVE : TAB_IDLE}`}
              >
                {copy[key]}
              </button>
            ))}
          </div>
        )
      }
    />
  );
}
