"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { ArrowDownUp, Copy, ImageOff, Loader2, PackageX, Pencil, Plus, Trash2 } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Pagination } from "@/components/admin/Pagination";
import { withWorkspaceParams } from "@/components/admin/products/productsTabs";
import { PRODUCTS_PATH, rememberProductList } from "@/components/admin/products/listReturn";
import { SortableHeader, type SortState } from "@/components/admin/SortableHeader";
import { CatalogSearch } from "@/components/catalog/CatalogSearch";
import { Alert } from "@/components/ui/Alert";
import { Switch } from "@/components/ui/Switch";
import {
  ADMIN_PAGE_SIZE,
  adminDeleteProducts,
  adminDuplicateProducts,
  adminListProductsPage,
  adminListSegments,
  adminSetProductPublished,
} from "@/lib/adminApi";
import { fetchCategories } from "@/lib/catalogApi";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";
import { formatMoney } from "@/lib/format";
import type { AdminProduct, AdminVariant, Category, ProductSort, Segment } from "@/types";

const LOW_STOCK = 10;

const checkboxClass =
  "h-4 w-4 cursor-pointer rounded border-slate-300 accent-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20";

interface ListState {
  key: string;
  products: AdminProduct[];
  /** Total matches across all pages. */
  total: number;
  error: string | null;
}

/**
 * The colour the row speaks for: the first the server sent, which is the admin's
 * own order. A product's price is the same in every colour, so this is where the
 * row's price comes from; its stock is the sum of all of them (`retailStock`).
 */
function sheetVariant(product: AdminProduct): AdminVariant | null {
  return product.variants[0] ?? null;
}

/** The retail stock of every colour together, and how many colours that was. */
function StockPill({ quantity, colors }: { quantity: number; colors: number }) {
  const tone =
    quantity === 0
      ? "bg-red-600 text-white ring-red-600"
      : quantity < LOW_STOCK
        ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30"
        : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10";
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${tone}`}>
        {quantity === 0 ? "Yok" : quantity.toLocaleString("tr-TR")}
      </span>
      {colors > 1 && (
        <span className="text-[10px] leading-none text-slate-500 dark:text-zinc-500">{colors} renk</span>
      )}
    </span>
  );
}

function Thumbnail({ product }: { product: AdminProduct }) {
  if (!product.image_url)
    return (
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-zinc-600">
        <ImageOff className="h-4 w-4" aria-hidden />
      </span>
    );
  return (
    // A plain img: 50 dense rows of supplier and uploaded photos, no optimisation
    // pass worth paying for.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image_url}
      alt=""
      className="h-12 w-12 rounded-lg bg-white object-contain ring-1 ring-inset ring-black/[0.06] dark:bg-zinc-100 dark:ring-white/10"
    />
  );
}

/**
 * "Ürünler & Stok": the retail view of the catalogue — photo, code and name,
 * retail stock and price — with the publish switch and a way into the full sheet.
 * Everything else about a product (prices per segment, rules, fırsat,
 * weight) is edited in the sheet.
 */
const SORTS: readonly ProductSort[] = ["code", "name", "stock", "price"];

/** The list's state as its URL keeps it: ?kategori=&q=&sira=&yon=&sayfa= (sayfa from 1). */
function stateFromUrl(params: URLSearchParams) {
  const by = params.get("sira") as ProductSort | null;
  const sort: SortState<ProductSort> = {
    by: by && SORTS.includes(by) ? by : null,
    dir: params.get("yon") === "desc" ? "desc" : "asc",
  };
  const page = Math.max(0, (Number.parseInt(params.get("sayfa") ?? "", 10) || 1) - 1);
  return { category: params.get("kategori") ?? "", query: params.get("q") ?? "", sort, page };
}

function urlFromState(category: string, query: string, sort: SortState<ProductSort>, page: number): string {
  const params = new URLSearchParams();
  if (category) params.set("kategori", category);
  if (query) params.set("q", query);
  if (sort.by) {
    params.set("sira", sort.by);
    params.set("yon", sort.dir);
  }
  if (page > 0) params.set("sayfa", String(page + 1));
  return params.toString();
}

export function AdminProductsView({
  embedded = false,
  onSortCategory,
}: {
  /** In "Ürünler & Stok"'s tabs, under their heading: no heading of its own. */
  embedded?: boolean;
  /** "Bu Kategoriyi Sırala": open the category's own order (the other tab). */
  onSortCategory?: (categoryId: number) => void;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read once: from here on the list owns its state and writes it back into the URL.
  const [initial] = useState(() => stateFromUrl(new URLSearchParams(searchParams.toString())));
  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState<string>(initial.category);
  const [categories, setCategories] = useState<Category[]>([]);
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [list, setList] = useState<ListState | null>(null);
  // The page belongs to one search/category: a new filter starts again at page 1.
  const [paging, setPaging] = useState<{ filter: string; page: number }>(() => ({
    filter: `${initial.category}|${initial.query}|${initial.sort.by ?? ""}|${initial.sort.dir}`,
    page: initial.page,
  }));
  const [publishing, setPublishing] = useState<ReadonlySet<string>>(new Set());
  const [publishError, setPublishError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState<ProductSort>>(initial.sort);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<"delete" | "duplicate" | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const tableTop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetchCategories(controller.signal), adminListSegments(controller.signal)])
      .then(([cats, segs]) => {
        setCategories(cats);
        setSegments(segs);
      })
      .catch(() => {
        // Products still load; without segments the retail price shows as "—".
      });
    return () => controller.abort();
  }, []);

  const filter = `${category}|${query}|${sort.by ?? ""}|${sort.dir}`;
  const page = paging.filter === filter ? paging.page : 0;
  const key = `${filter}|${page}`;
  useEffect(() => {
    const controller = new AbortController();
    adminListProductsPage({ q: query, category, page, orderBy: sort.by, orderDir: sort.dir }, controller.signal)
      .then(({ products, total }) => setList({ key, products, total, error: null }))
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setList({ key, products: [], total: 0, error: getApiErrorMessage(err, "Ürünler yüklenemedi.") });
      });
    return () => controller.abort();
  }, [key, query, category, page, sort.by, sort.dir]);

  // Category, search, sort and page live in the URL: Back (or the sheet's
  // "Geri Dön") brings the list back exactly as it was left.
  useEffect(() => {
    const qs = urlFromState(category, query, sort, page);
    rememberProductList(qs);
    // The tabs' own params (`?sekme=`) stay beside the list's.
    const full = withWorkspaceParams(qs);
    if (full !== window.location.search.replace(/^\?/, "")) {
      router.replace(full ? `${PRODUCTS_PATH}?${full}` : PRODUCTS_PATH, { scroll: false });
    }
  }, [router, category, query, sort, page]);

  const sortableCategory = category ? categories.find((c) => c.slug === category) : undefined;

  /** A category is browsed in code order: the codes of one family sit together. */
  function chooseCategory(slug: string) {
    setCategory(slug);
    if (slug) setSort({ by: "code", dir: "asc" });
  }

  function goTo(next: number) {
    setPaging({ filter, page: next });
    tableTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const current = list?.key === key ? list : null;
  // Keep the old rows visible (dimmed) while a new search loads.
  const shown = current ?? list;
  const retailSegmentId = segments?.find((s) => s.code === "RETAIL")?.id;

  function retailPrice(variant: AdminVariant | null): string {
    const row = retailSegmentId
      ? variant?.prices.find((p) => p.segment_id === retailSegmentId && p.currency === "TRY")
      : undefined;
    return row ? formatMoney(row.price_incl_tax) : "—";
  }

  /** The stock of every colour together — the one stock every buyer draws from. */
  function stockOf(product: AdminProduct): number {
    return product.variants.reduce(
      (sum, v) => sum + (v.inventory.find((i) => i.warehouse_type === "RETAIL_STOCK")?.quantity ?? 0),
      0,
    );
  }

  /** Optimistic: the row flips at once and goes back if the server refuses. */
  async function togglePublished(product: AdminProduct, next: boolean) {
    if (publishing.has(product.id)) return;
    setPublishError(null);
    setPublishing((prev) => new Set(prev).add(product.id));
    const apply = (value: boolean) =>
      setList((prev) =>
        prev
          ? { ...prev, products: prev.products.map((p) => (p.id === product.id ? { ...p, is_published: value } : p)) }
          : prev,
      );
    apply(next);
    try {
      apply(await adminSetProductPublished(product.id, next));
      // Published or withdrawn: the storefront's cached lists (the homepage's
      // "Yeni Gelenler" among them) must show it, or stop showing it, now.
      void refreshStorefront();
    } catch (err) {
      apply(!next);
      setPublishError(getApiErrorMessage(err, "Yayın durumu değiştirilemedi."));
    } finally {
      setPublishing((prev) => {
        const rest = new Set(prev);
        rest.delete(product.id);
        return rest;
      });
    }
  }

  const pageIds = shown?.products.map((p) => p.id) ?? [];
  // Only rows still on screen count as selected, so a filter change cannot delete
  // something the admin can no longer see.
  const selectedHere = pageIds.filter((id) => selected.has(id));
  const allSelected = pageIds.length > 0 && selectedHere.length === pageIds.length;

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pageIds));

  async function removeSelected() {
    if (bulkBusy || selectedHere.length === 0) return;
    const names = shown?.products.filter((p) => selectedHere.includes(p.id)).map((p) => p.name) ?? [];
    if (!window.confirm(`${names.length} ürün silinecek:\n\n${names.join("\n")}\n\nBu işlem geri alınamaz.`)) return;
    setBulkBusy("delete");
    setNotice(null);
    try {
      const { deleted, refused } = await adminDeleteProducts(selectedHere);
      // Gone from the catalogue: drop the storefront's cached lists, or a deleted
      // product lingers on the homepage ("Yeni Gelenler") until they expire.
      if (deleted.length > 0) void refreshStorefront();
      const gone = new Set(deleted);
      setList((prev) =>
        prev
          ? { ...prev, products: prev.products.filter((p) => !gone.has(p.id)), total: prev.total - gone.size }
          : prev,
      );
      setSelected(new Set(Object.keys(refused)));
      const kept = Object.values(refused);
      setNotice({
        kind: kept.length > 0 ? "error" : "success",
        text:
          kept.length > 0
            ? `${deleted.length} ürün silindi. Silinemeyen: ${kept.join(" · ")}`
            : `${deleted.length} ürün silindi.`,
      });
    } catch (err) {
      setNotice({ kind: "error", text: getApiErrorMessage(err, "Ürünler silinemedi.") });
    } finally {
      setBulkBusy(null);
    }
  }

  async function duplicateSelected() {
    if (bulkBusy || selectedHere.length === 0) return;
    setBulkBusy("duplicate");
    setNotice(null);
    try {
      const copies = await adminDuplicateProducts(selectedHere);
      // Each copy lands directly under the row it came from, so the admin sees it
      // without waiting for a re-sort.
      setList((prev) => {
        if (!prev) return prev;
        const bySource = new Map(selectedHere.map((id, i) => [id, copies[i]]));
        const products = prev.products.flatMap((p) => {
          const copy = bySource.get(p.id);
          return copy ? [p, copy] : [p];
        });
        return { ...prev, products, total: prev.total + copies.length };
      });
      setSelected(new Set());
      setNotice({ kind: "success", text: `${copies.length} ürün kopyalandı · kopyalar yayında değil (taslak).` });
    } catch (err) {
      setNotice({ kind: "error", text: getApiErrorMessage(err, "Ürünler kopyalanamadı.") });
    } finally {
      setBulkBusy(null);
    }
  }

  return (
    <>
      {!embedded && (
        <AdminPageHeader
          title="Ürünler & Stok"
          description="Stok ve perakende fiyatı izleyin, ürünü yayından alın. Diğer tüm alanlar (fiyat tablosu, kurallar, fırsat) ürün formunda."
        />
      )}

      {/* One control bar over the table: search and category on the left, then the
          actions on the right — new, duplicate, and delete at the far edge. */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <CatalogSearch
          onSearch={setQuery}
          busy={!current && !!list}
          placeholder="Ürün adı, marka veya kod"
          initial={initial.query}
        />
        <label className="sr-only" htmlFor="admin-category">
          Kategori
        </label>
        <select
          id="admin-category"
          value={category}
          onChange={(e) => chooseCategory(e.target.value)}
          className="h-10 shrink-0 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        {/* "Akıllı geçiş": the chosen category's own order, a click away. */}
        {onSortCategory && sortableCategory && (
          <button
            type="button"
            onClick={() => onSortCategory(sortableCategory.id)}
            title={`“${sortableCategory.name}” kategori sayfasındaki ürün sırasını düzenle`}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition-colors hover:border-red-400 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
          >
            <ArrowDownUp className="h-4 w-4" aria-hidden />
            Bu Kategoriyi Sırala
          </button>
        )}

        {/* The actions sit together at the right edge, ending with the destructive one. */}
        <div className="flex items-center gap-3 lg:ml-auto">
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-500 dark:hover:bg-red-400"
          >
            <Plus className="h-4 w-4" aria-hidden /> Yeni Ürün
          </Link>
          <button
            type="button"
            onClick={duplicateSelected}
            disabled={selectedHere.length === 0 || bulkBusy !== null}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5"
          >
            {bulkBusy === "duplicate" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            Kopyala{selectedHere.length > 0 ? ` (${selectedHere.length})` : ""}
          </button>
          <button
            type="button"
            onClick={removeSelected}
            disabled={selectedHere.length === 0 || bulkBusy !== null}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-red-700 ring-1 ring-red-300 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-300 dark:ring-red-500/30 dark:hover:bg-red-500/10"
          >
            {bulkBusy === "delete" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            Sil{selectedHere.length > 0 ? ` (${selectedHere.length})` : ""}
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-4">
          <Alert variant={notice.kind === "error" ? "error" : "success"}>{notice.text}</Alert>
        </div>
      )}

      {publishError && (
        <div className="mb-4">
          <Alert variant="error">{publishError}</Alert>
        </div>
      )}

      <div ref={tableTop} className={`${panelClass} scroll-mt-[calc(var(--header-height)+1rem)] overflow-hidden`}>
        {!shown ? (
          <div className="space-y-2 p-4" aria-busy>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" />
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
          <div className={`transition-opacity ${current ? "" : "opacity-60"}`}>
            {/* Percentage columns beside the fixed checkbox and thumbnail: everything
                fits, at any width, with no horizontal scroll. */}
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-zinc-500">
                  <th scope="col" className="w-10 pl-4 pr-1 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      // Some but not all: the box shows the in-between state.
                      ref={(el) => {
                        if (el) el.indeterminate = selectedHere.length > 0 && !allSelected;
                      }}
                      onChange={toggleAll}
                      disabled={pageIds.length === 0}
                      aria-label="Tüm ürünleri seç"
                      className={checkboxClass}
                    />
                  </th>
                  <th scope="col" className="w-16 px-3 py-3">
                    <span className="sr-only">Görsel</span>
                  </th>
                  <SortableHeader column="code" label="Ürün Kodu" sort={sort} onSort={setSort} className="w-[17%]" />
                  <SortableHeader column="name" label="Ürün" sort={sort} onSort={setSort} className="w-[30%]" />
                  <SortableHeader column="stock" label="Stok" sort={sort} onSort={setSort} align="center" className="w-[12%]" />
                  <SortableHeader column="price" label="Fiyat" sort={sort} onSort={setSort} align="right" className="w-[15%]" />
                  <th scope="col" className="w-[18%] px-3 py-3 text-right">Yayın Durumu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {shown.products.map((product) => {
                  const variant = sheetVariant(product);
                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        selected.has(product.id)
                          ? "bg-red-50/60 dark:bg-red-500/[0.07]"
                          : "hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                      } ${product.is_published ? "" : "opacity-60"}`}
                    >
                      <td className="pl-4 pr-1 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(product.id)}
                          onChange={() => toggleRow(product.id)}
                          aria-label={`${product.name} ürününü seç`}
                          className={checkboxClass}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <Thumbnail product={product} />
                      </td>
                      <td className="px-3 py-2.5">
                        {/* The product code: a coloured product has one stock code
                            per colour, which the sheet lists. */}
                        <span className="block truncate font-mono text-xs font-medium" title={product.base_code}>
                          {product.base_code}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium" title={product.name}>
                              {product.name}
                            </span>
                            <span className="block truncate text-xs text-slate-500 dark:text-zinc-500">
                              {product.is_published ? (
                                product.brand
                              ) : (
                                <span className="font-medium text-amber-700 dark:text-amber-400">Taslak</span>
                              )}
                            </span>
                          </span>
                          <Link
                            href={`/admin/products/${product.id}`}
                            aria-label={`${product.name} ürününü düzenle`}
                            title="Ürünü düzenle"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-red-400"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {variant ? <StockPill quantity={stockOf(product)} colors={product.variants.length} /> : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{retailPrice(variant)}</td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center justify-end gap-2">
                          <span
                            className={`text-xs font-medium ${
                              product.is_published
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-slate-400 dark:text-zinc-500"
                            }`}
                            id={`publish-${product.id}`}
                          >
                            {product.is_published ? "Yayında" : "Kapalı"}
                          </span>
                          <Switch
                            checked={product.is_published}
                            onChange={(value) => void togglePublished(product, value)}
                            labelledBy={`publish-${product.id}`}
                            disabled={publishing.has(product.id)}
                            tone="success"
                          />
                        </span>
                      </td>
                    </tr>
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
      </div>
    </>
  );
}
