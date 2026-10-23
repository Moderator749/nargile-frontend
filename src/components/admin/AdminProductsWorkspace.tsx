"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, Boxes, Tags } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminBrandsView } from "@/components/admin/AdminBrandsView";
import { AdminProductOrderView } from "@/components/admin/AdminProductOrderView";
import { AdminProductsView } from "@/components/admin/AdminProductsView";
import { PRODUCTS_PATH } from "@/components/admin/products/listReturn";
import { BRANDS_TAB, ORDER_CATEGORY_PARAM, ORDER_TAB, TAB_PARAM, withTabParams } from "@/components/admin/products/productsTabs";

type Tab = "list" | "order" | "brands";

/** Each tab's value in the address (`?sekme=`); the list has none. */
const PARAM_OF: Record<Tab, string | null> = { list: null, order: ORDER_TAB, brands: BRANDS_TAB };
const tabOf = (param: string | null): Tab => (param === ORDER_TAB ? "order" : param === BRANDS_TAB ? "brands" : "list");

const TABS: { value: Tab; label: string; Icon: typeof Boxes; description: string }[] = [
  {
    value: "list",
    label: "Ürün & Stok Listesi",
    Icon: Boxes,
    description:
      "Perakende stok ve fiyatı izleyin, ürünü yayından alın. Diğer tüm alanlar (fiyat tablosu, kotalar, kurallar, fırsat) ürün formunda.",
  },
  {
    value: "order",
    label: "Kategori Vitrin Sıralaması",
    Icon: ArrowDownUp,
    description:
      "Bir kategori sayfasındaki ürünlerin “Önerilen” sırası. Ürünü tutamaçtan sürükleyin ya da en üste taşıyın; her değişiklik hemen kaydedilir. Sıraya alınmamış ürünler arkadan ada göre gelir.",
  },
  {
    value: "brands",
    label: "Markalar",
    Icon: Tags,
    description:
      "Ana sayfadaki kayan marka şeridi (logolarıyla), marka sayfaları (/marka/…) ve ürün formundaki marka listesi. Sırayı tutamaçtan sürükleyerek değiştirin; her taşıma hemen kaydedilir. Logo için şeffaf arka planlı PNG en iyi sonucu verir.",
  },
];

/**
 * "Ürünler & Stok": the product list, a category page's own order and the
 * brands, as three tabs under one heading. The tab is in the address
 * (`?sekme=siralama`, `?sekme=markalar`), so a refresh or a shared link opens
 * it again.
 *
 * Each tab keeps its own state: once opened, a tab stays mounted (hidden
 * while the other is shown), so the list's search, category, sort and page
 * and the order's category survive every switch, and neither touches the
 * other. "Bu Kategoriyi Sırala" beside the list's category filter opens the
 * order on that same category.
 */
export function AdminProductsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(tabOf(searchParams.get(TAB_PARAM)));
  const [brandsMounted, setBrandsMounted] = useState(tab === "brands");
  // The order tab mounts when first opened, on the category it was asked for;
  // "Bu Kategoriyi Sırala" opens it afresh (`n`) on the list's category.
  const [order, setOrder] = useState(() => {
    const id = Number(searchParams.get(ORDER_CATEGORY_PARAM));
    return { mounted: tab === "order", categoryId: Number.isInteger(id) && id > 0 ? id : null, n: 0 };
  });

  function go(query: string) {
    router.replace(query ? `${PRODUCTS_PATH}?${query}` : PRODUCTS_PATH, { scroll: false });
  }

  function show(next: Tab) {
    setTab(next);
    if (next === "order") setOrder((o) => ({ ...o, mounted: true }));
    if (next === "brands") setBrandsMounted(true);
    go(withTabParams({ [TAB_PARAM]: PARAM_OF[next] }));
  }

  /** "Bu Kategoriyi Sırala": the order tab, on this category. */
  function sortCategory(categoryId: number) {
    setTab("order");
    setOrder((o) => ({ mounted: true, categoryId, n: o.n + 1 }));
    go(withTabParams({ [TAB_PARAM]: ORDER_TAB, [ORDER_CATEGORY_PARAM]: String(categoryId) }));
  }

  const active = TABS.find((t) => t.value === tab) ?? TABS[0];
  return (
    <>
      <AdminPageHeader title="Ürünler & Stok" description={active.description} />

      <div role="tablist" aria-label="Ürünler & Stok" className="mb-6 flex gap-1 border-b border-slate-200 dark:border-white/10">
        {TABS.map(({ value, label, Icon }) => {
          const selected = value === tab;
          return (
            <button
              key={value}
              id={`products-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`products-panel-${value}`}
              onClick={() => show(value)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-500 ${
                selected
                  ? "border-red-600 text-red-700 dark:border-red-500 dark:text-red-400"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <div id="products-panel-list" role="tabpanel" aria-labelledby="products-tab-list" hidden={tab !== "list"}>
        <AdminProductsView embedded onSortCategory={sortCategory} />
      </div>
      {order.mounted && (
        <div id="products-panel-order" role="tabpanel" aria-labelledby="products-tab-order" hidden={tab !== "order"}>
          <AdminProductOrderView
            key={order.n}
            embedded
            initialCategoryId={order.categoryId}
            onCategoryChange={(id) => go(withTabParams({ [ORDER_CATEGORY_PARAM]: id ? String(id) : null }))}
          />
        </div>
      )}
      {brandsMounted && (
        <div id="products-panel-brands" role="tabpanel" aria-labelledby="products-tab-brands" hidden={tab !== "brands"}>
          <AdminBrandsView embedded />
        </div>
      )}
    </>
  );
}
