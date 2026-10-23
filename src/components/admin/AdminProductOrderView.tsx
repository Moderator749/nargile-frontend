"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpToLine, ImageOff, Loader2, RotateCcw } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { SortableList } from "@/components/admin/SortableList";
import { Alert } from "@/components/ui/Alert";
import { adminCategoryProductOrder, adminListCategories, adminSetCategoryProductOrder } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";
import type { AdminCategory, CategoryProductOrderRow } from "@/types";

const rowBtn =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/5";

/** Groups first, each followed by its subcategories, in the menu's order. */
function categoryOptions(categories: AdminCategory[]) {
  const byOrder = (a: AdminCategory, b: AdminCategory) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "tr");
  const groups = categories.filter((c) => c.parent_id === null).sort(byOrder);
  const known = new Set(groups.map((g) => g.id));
  const options: { id: number; label: string }[] = [];
  for (const g of groups) {
    options.push({ id: g.id, label: g.name });
    for (const c of categories.filter((x) => x.parent_id === g.id).sort(byOrder)) {
      options.push({ id: c.id, label: `— ${c.name}` });
    }
  }
  // A subcategory whose group is gone still gets a line.
  for (const c of categories.filter((x) => x.parent_id !== null && !known.has(x.parent_id))) {
    options.push({ id: c.id, label: c.name });
  }
  return options;
}

const rankedCount = (rows: CategoryProductOrderRow[]) => rows.filter((r) => r.position !== null).length;

/**
 * Admin: a category page's own order under "Önerilen". Drag a product, or pin
 * it to the top; every move is saved at once. The ranked products lead the
 * page; the rest follow by name — so products added later fall in behind.
 */
export function AdminProductOrderView() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [rows, setRows] = useState<CategoryProductOrderRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  // Saves go one after another, so the last move is the one that sticks.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    adminListCategories(controller.signal)
      .then(setCategories)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Kategoriler yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (categoryId === null) return;
    const controller = new AbortController();
    adminCategoryProductOrder(categoryId, controller.signal)
      .then(setRows)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setResult({ kind: "error", text: getApiErrorMessage(err, "Ürünler yüklenemedi.") });
      });
    return () => controller.abort();
  }, [categoryId]);

  const options = useMemo(() => categoryOptions(categories ?? []), [categories]);
  const ranked = rows ? rankedCount(rows) : 0;

  /** Show `next` at once (its first `count` ranked) and save it behind. */
  function save(next: CategoryProductOrderRow[], count: number, done: string) {
    if (categoryId === null || !rows) return;
    const before = rows;
    const id = categoryId;
    setRows(next.map((r, i) => ({ ...r, position: i < count ? i : null })));
    setResult(null);
    setSaving(true);
    pending.current += 1;
    queue.current = queue.current
      .then(() => adminSetCategoryProductOrder(id, next.slice(0, count).map((r) => r.product_id)))
      .then(
        (saved) => {
          if (pending.current === 1) setRows(saved);
          setResult({ kind: "success", text: done });
          void refreshStorefront();
        },
        (err: unknown) => {
          setRows(before);
          setResult({ kind: "error", text: getApiErrorMessage(err, "Sıra kaydedilemedi.") });
        },
      )
      .finally(() => {
        pending.current -= 1;
        if (pending.current === 0) setSaving(false);
      });
  }

  /**
   * A move ranks everything above where the product lands: what sits above it
   * is now the admin's choice too. The rest stay as they were (by name).
   */
  function moved(next: CategoryProductOrderRow[], productId: string, done: string) {
    if (!rows) return;
    const from = rows.findIndex((r) => r.product_id === productId);
    const to = next.findIndex((r) => r.product_id === productId);
    const count = Math.max(ranked + (from >= ranked ? 1 : 0), to + 1);
    save(next, count, done);
  }

  function onReorder(next: CategoryProductOrderRow[], productId: string) {
    const row = next.find((r) => r.product_id === productId);
    if (row) moved(next, productId, `${row.name} taşındı.`);
  }

  function pinToTop(row: CategoryProductOrderRow) {
    if (!rows) return;
    const next = [row, ...rows.filter((r) => r.product_id !== row.product_id)];
    moved(next, row.product_id, `${row.name} en üste taşındı.`);
  }

  function reset() {
    if (!rows || !window.confirm("Bu kategorinin sırası sıfırlansın mı? Ürünler ada göre listelenir.")) return;
    const byName = [...rows].sort((a, b) => a.name.localeCompare(b.name, "tr"));
    save(byName, 0, "Sıra sıfırlandı: ürünler ada göre.");
  }

  const category = categories?.find((c) => c.id === categoryId);

  return (
    <>
      <AdminPageHeader
        title="Ürün Sıralaması"
        description="Bir kategori sayfasındaki ürünlerin “Önerilen” sırası. Ürünü tutamaçtan sürükleyin ya da en üste taşıyın; her değişiklik hemen kaydedilir. Sıraya alınmamış ürünler arkadan ada göre gelir."
      />

      <section className={`${panelClass} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center dark:border-white/10">
          <label htmlFor="order-category" className="text-sm font-medium">
            Kategori
          </label>
          <select
            id="order-category"
            value={categoryId ?? ""}
            disabled={!categories}
            onChange={(e) => {
              setRows(null);
              setResult(null);
              setCategoryId(e.target.value ? Number(e.target.value) : null);
            }}
            className="h-10 min-w-0 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 sm:w-80 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Kategori seçin…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          {rows && (
            <div className="flex items-center gap-3 sm:ms-auto">
              <span className="text-xs text-slate-500 tabular-nums dark:text-zinc-400" aria-live="polite">
                {saving ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Kaydediliyor…
                  </span>
                ) : (
                  `${rows.length} ürün · ${ranked} sıralı`
                )}
              </span>
              <button type="button" onClick={reset} disabled={ranked === 0} className={rowBtn}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Sıfırla
              </button>
            </div>
          )}
        </div>

        {result && (
          <div className="px-5 pt-4">
            <Alert variant={result.kind}>{result.text}</Alert>
          </div>
        )}

        {loadError ? (
          <div className="p-5">
            <Alert variant="error">{loadError}</Alert>
          </div>
        ) : categoryId === null ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500 dark:text-zinc-400">
            Sıralamak için bir kategori seçin. Bir ana kategorinin sırası alt kategorilerinden ayrıdır.
          </p>
        ) : rows === null ? (
          <div className="h-64 motion-safe:animate-pulse" aria-busy />
        ) : rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500 dark:text-zinc-400">
            {category ? `“${category.name}” kategorisinde ürün yok.` : "Bu kategoride ürün yok."}
          </p>
        ) : (
          <SortableList
            items={rows}
            getId={(r) => r.product_id}
            getLabel={(r) => r.name}
            onReorder={onReorder}
            className="divide-y divide-slate-200 dark:divide-white/10"
            renderItem={(r, handle, index) => (
              <div className={`flex items-center gap-3 py-2.5 pe-4 ps-2 ${index === ranked && ranked > 0 ? "border-t-2 border-dashed border-slate-300 dark:border-white/15" : ""}`}>
                {handle}
                <span
                  title={r.position === null ? "Sıralı değil: ada göre" : "Sıralı"}
                  className={`w-7 shrink-0 text-right font-mono text-xs tabular-nums ${
                    r.position === null ? "text-slate-400 dark:text-zinc-500" : "font-semibold text-red-600 dark:text-red-400"
                  }`}
                >
                  {index + 1}
                </span>
                {r.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a dense list of supplier photos
                  <img src={r.image_url} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg bg-slate-100 object-cover dark:bg-white/5" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-zinc-600">
                    <ImageOff className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                    {r.base_code}
                    {r.brand ? ` · ${r.brand}` : ""}
                    {!r.is_published && <span className="ms-1.5 rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">Yayında değil</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => pinToTop(r)}
                  disabled={index === 0}
                  aria-label={`En üste taşı: ${r.name}`}
                  title="En üste taşı"
                  className={rowBtn}
                >
                  <ArrowUpToLine className="h-3.5 w-3.5" aria-hidden />
                  <span className="max-sm:sr-only">En Üste Taşı</span>
                </button>
              </div>
            )}
          />
        )}
      </section>
    </>
  );
}
