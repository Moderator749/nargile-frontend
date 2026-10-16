"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Package } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { fetchProductsByIds } from "@/lib/catalogApi";
import { PAGE_CONTAINER } from "@/lib/layout";
import { productHref, productImageAlt } from "@/lib/seo";
import { displayVariant } from "@/lib/variants";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct } from "@/types";

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
 * "Sizin İçin Seçtiklerimiz": two short lists behind a pair of tabs, as plain
 * photo-and-caption cards — the photo straight on the section's white, the brand, the
 * name and the price set beneath it, with no card around any of it.
 *
 * The lists arrive server-rendered at the public (retail) price. A signed-in
 * visitor gets both re-priced for their own segment in one request; until that
 * answers, the prices stay masked (`public-price`) rather than showing a figure
 * that is not theirs.
 */
export function FeaturedProductsShowcase({ lists }: { lists: Record<TabKey, CatalogProduct[]> }) {
  const [tab, setTab] = useState<TabKey>("newest");
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const money = useDisplayMoney();
  const [own, setOwn] = useState<{
    token: string;
    byId: Map<string, CatalogProduct>;
  } | null>(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    const ids = [...new Set(TABS.flatMap(({ key }) => lists[key].map((p) => p.id)))];
    if (ids.length === 0) return;
    const controller = new AbortController();
    fetchProductsByIds(ids, controller.signal)
      .then((products) => setOwn({ token, byId: new Map(products.map((p) => [p.id, p])) }))
      .catch((err: unknown) => {
        // Unpriced for this account is still better than a guest's price.
        if (!axios.isCancel(err)) setOwn({ token, byId: new Map() });
      });
    return () => controller.abort();
  }, [hydrated, token, lists]);

  const visible = TABS.filter(({ key }) => lists[key].length > 0);
  if (visible.length === 0) return null;
  const active = lists[tab].length > 0 ? tab : visible[0].key;
  const mine = hydrated && token && own?.token === token ? own.byId : null;
  const publicPrices = !mine;

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
            const price = displayVariant(product)?.price ?? null;
            return (
              <li key={product.id}>
                <Link
                  href={productHref(product)}
                  className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900 dark:focus-visible:outline-white"
                >
                  {/* No surface of its own on white. On the dark theme the photo still
                      needs a light one: it is multiplied into what is behind it,
                      and over black it would go black. */}
                  <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-transparent p-6 dark:bg-zinc-100">
                    <ProductImage
                      src={product.image_url}
                      alt={productImageAlt(product)}
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                      surfaceClassName="w-full bg-transparent"
                      imageClassName="object-contain mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
                      fallback={<Package className="h-10 w-10 text-gray-300" strokeWidth={1} aria-hidden />}
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-1 text-left">
                    {product.brand && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 md:text-xs dark:text-neutral-400">
                        {product.brand.toLocaleUpperCase("tr-TR")}
                      </p>
                    )}
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 group-hover:underline dark:text-white">
                      {product.name}
                    </h3>
                    <p
                      className={`mt-1 w-fit text-lg font-bold text-gray-900 dark:text-white ${publicPrices ? "public-price" : ""}`}
                    >
                      <span>{price ? money.format(price) : "—"}</span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
