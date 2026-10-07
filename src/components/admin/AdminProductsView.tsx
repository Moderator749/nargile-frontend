"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronRight, PackageX } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Pagination } from "@/components/admin/Pagination";
import { PricingEditor } from "@/components/admin/PricingEditor";
import { WeightCell } from "@/components/admin/WeightCell";
import { CatalogSearch } from "@/components/catalog/CatalogSearch";
import { Alert } from "@/components/ui/Alert";
import { ADMIN_PAGE_SIZE, adminListProductsPage, adminListSegments } from "@/lib/adminApi";
import { fetchCategories } from "@/lib/catalogApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import type { AdminProduct, AdminVariant, AdminVariantPrice, Category, Segment, WarehouseType } from "@/types";

const LOW_STOCK = 10;

interface ListState {
  key: string;
  products: AdminProduct[];
  /** Total matches across all pages. */
  total: number;
  error: string | null;
}

function stockOf(variant: AdminVariant, warehouse: WarehouseType): number {
  return variant.inventory.find((i) => i.warehouse_type === warehouse)?.quantity ?? 0;
}

function StockPill({ quantity }: { quantity: number }) {
  const tone =
    quantity === 0
      ? "bg-red-600 text-white ring-red-600"
      : quantity < LOW_STOCK
        ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30"
        : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10";
  return (
    <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${tone}`}>
      {quantity === 0 ? "Yok" : quantity.toLocaleString("tr-TR")}
    </span>
  );
}

export function AdminProductsView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [list, setList] = useState<ListState | null>(null);
  // The page belongs to one search/category: a new filter starts again at page 1.
  const [paging, setPaging] = useState<{ filter: string; page: number }>({ filter: "|", page: 0 });
  const [open, setOpen] = useState<string | null>(null);
  const tableTop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetchCategories(controller.signal), adminListSegments(controller.signal)])
      .then(([cats, segs]) => {
        setCategories(cats);
        setSegments(segs);
      })
      .catch(() => {
        // Products still load; the pricing editor stays disabled without segments.
      });
    return () => controller.abort();
  }, []);

  const filter = `${category}|${query}`;
  const page = paging.filter === filter ? paging.page : 0;
  const key = `${filter}|${page}`;
  useEffect(() => {
    const controller = new AbortController();
    adminListProductsPage({ q: query, category, page }, controller.signal)
      .then(({ products, total }) => setList({ key, products, total, error: null }))
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setList({ key, products: [], total: 0, error: getApiErrorMessage(err, "Ürünler yüklenemedi.") });
      });
    return () => controller.abort();
  }, [key, query, category, page]);

  function goTo(next: number) {
    setPaging({ filter, page: next });
    setOpen(null);
    tableTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const current = list?.key === key ? list : null;
  // Keep the old rows visible (dimmed) while a new search loads.
  const shown = current ?? list;
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  // Kömürler and its subcategories: those variants need a weight (20 kg free-shipping rule).
  const coalRoot = categories.find((c) => c.slug === "komurler");
  const coalIds = new Set(coalRoot ? [coalRoot.id, ...categories.filter((c) => c.parent_id === coalRoot.id).map((c) => c.id)] : []);
  const segmentByCode = new Map(segments?.map((s) => [s.code, s]) ?? []);

  function priceFor(variant: AdminVariant, code: "RETAIL" | "DEALER"): string {
    const seg = segmentByCode.get(code);
    const p = seg && variant.prices.find((x) => x.segment_id === seg.id && x.currency === "TRY");
    return p ? formatMoney(p.price_incl_tax) : "—";
  }

  function updateVariantWeight(productId: string, variantId: string, weightKg: string | null) {
    setList((prev) =>
      prev
        ? {
            ...prev,
            products: prev.products.map((p) =>
              p.id !== productId
                ? p
                : { ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, weight_kg: weightKg } : v)) },
            ),
          }
        : prev,
    );
  }

  function updateVariantPrices(productId: string, variantId: string, prices: AdminVariantPrice[]) {
    setList((prev) =>
      prev
        ? {
            ...prev,
            products: prev.products.map((p) =>
              p.id !== productId
                ? p
                : { ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, prices } : v)) },
            ),
          }
        : prev,
    );
  }

  const rows = shown?.products.flatMap((product) =>
    product.variants.length
      ? product.variants.map((variant) => ({ product, variant }))
      : [{ product, variant: null as AdminVariant | null }],
  );

  return (
    <>
      <AdminPageHeader
        title="Ürünler & Stok"
        description="Segment fiyatlarını güncelleyin, perakende ve B2B stok havuzlarını izleyin."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <CatalogSearch onSearch={setQuery} busy={!current && !!list} placeholder="Ürün adı, marka veya kod" />
        <label className="sr-only" htmlFor="admin-category">
          Kategori
        </label>
        <select
          id="admin-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div ref={tableTop} className={`${panelClass} scroll-mt-[calc(var(--header-height)+1rem)] overflow-hidden`}>
        {!shown ? (
          <div className="space-y-2 p-4" aria-busy>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" />
            ))}
          </div>
        ) : shown.products.length === 0 && shown.error ? (
          <div className="p-4">
            <Alert variant="error">{shown.error}</Alert>
          </div>
        ) : shown.products.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <PackageX className="h-9 w-9 text-slate-300 dark:text-zinc-700" strokeWidth={1.5} aria-hidden />
            <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">Eşleşen ürün bulunamadı.</p>
          </div>
        ) : (
          <div className={`scrollbar-visible overflow-x-auto transition-opacity ${current ? "" : "opacity-60"}`}>
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-zinc-500">
                  <th scope="col" className="px-4 py-3">Ürün</th>
                  <th scope="col" className="px-4 py-3">Kategori</th>
                  <th scope="col" className="px-4 py-3 text-center">Perakende stok</th>
                  <th scope="col" className="px-4 py-3 text-center">B2B stok</th>
                  <th scope="col" className="px-4 py-3 text-right" title="Birim ağırlık; kömürde 20 kg ücretsiz kargo kuralı için gerekli">
                    Ağırlık (kg)
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">Perakende</th>
                  <th scope="col" className="px-4 py-3 text-right">Bayi</th>
                  {/* Pinned right, so the action stays reachable however wide the table gets. */}
                  <th scope="col" className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_12px_-12px_rgb(0_0_0/0.25)] dark:bg-zinc-900">
                    <span className="sr-only">Fiyat düzenle</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rows!.map(({ product, variant }) => {
                  const rowId = variant?.id ?? product.id;
                  const expanded = open === rowId;
                  return (
                    <Fragment key={rowId}>
                      <tr className={`transition-colors ${expanded ? "bg-slate-50 dark:bg-white/[0.03]" : "hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"}`}>
                        <td className="w-64 max-w-64 px-4 py-3">
                          <p className="truncate font-medium" title={product.name}>{product.name}</p>
                          <p className="font-mono text-xs text-slate-500 dark:text-zinc-500">{variant?.sku ?? product.base_code}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                          {(product.category_id != null && categoryName.get(product.category_id)) || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">{variant ? <StockPill quantity={stockOf(variant, "RETAIL_STOCK")} /> : "—"}</td>
                        <td className="px-4 py-3 text-center">{variant ? <StockPill quantity={stockOf(variant, "B2B_STOCK")} /> : "—"}</td>
                        <td className="px-4 py-2">
                          {variant ? (
                            <WeightCell
                              variant={variant}
                              isCoal={product.category_id != null && coalIds.has(product.category_id)}
                              onSaved={(kg) => updateVariantWeight(product.id, variant.id, kg)}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{variant ? priceFor(variant, "RETAIL") : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{variant ? priceFor(variant, "DEALER") : "—"}</td>
                        <td
                          className={`sticky right-0 px-4 py-3 text-right shadow-[-8px_0_12px_-12px_rgb(0_0_0/0.25)] ${
                            expanded ? "bg-slate-50 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"
                          }`}
                        >
                          {variant ? (
                            <button
                              type="button"
                              onClick={() => setOpen(expanded ? null : rowId)}
                              disabled={!segments}
                              aria-expanded={expanded}
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              Fiyatlar
                              <ChevronRight
                                className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                                aria-hidden
                              />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-zinc-600">Varyant yok</span>
                          )}
                        </td>
                      </tr>
                      {expanded && variant && segments && (
                        <tr className="bg-slate-50 dark:bg-white/[0.03]">
                          <td colSpan={8} className="px-4 pb-5 pt-1">
                            <PricingEditor
                              variant={variant}
                              segments={segments}
                              onSaved={(prices) => updateVariantPrices(product.id, variant.id, prices)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {shown && shown.products.length > 0 && (
          <div className="flex flex-col items-center gap-3 border-t border-slate-200 p-4 sm:flex-row sm:justify-between dark:border-white/10">
            <p className="text-xs tabular-nums text-slate-500 dark:text-zinc-400">
              {(page * ADMIN_PAGE_SIZE + 1).toLocaleString("tr-TR")}–
              {Math.min((page + 1) * ADMIN_PAGE_SIZE, shown.total).toLocaleString("tr-TR")} /{" "}
              {shown.total.toLocaleString("tr-TR")} ürün
            </p>
            <Pagination
              page={page}
              pageCount={Math.ceil(shown.total / ADMIN_PAGE_SIZE)}
              onChange={goTo}
              label="Ürün sayfaları"
            />
          </div>
        )}
        {shown?.error && shown.products.length > 0 && (
          <div className="border-t border-slate-200 p-4 dark:border-white/10">
            <Alert variant="error">{shown.error}</Alert>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-zinc-500">
        Stok değerleri salt okunurdur; stok güncelleme için henüz bir API yok. 0 = tükendi, {LOW_STOCK} altı = azalıyor.
      </p>
    </>
  );
}
