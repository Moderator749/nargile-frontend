"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpToLine, ImageOff, Loader2, RotateCcw, X } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { SortableList } from "@/components/admin/SortableList";
import { CategoryCombobox } from "@/components/admin/products/CategoryCombobox";
import { Alert } from "@/components/ui/Alert";
import { adminCategoryProductOrder, adminListCategories, adminSetCategoryProductOrder } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { type Order, dragged, orderOf, orderRequest, toBottom, toTop, withPositions } from "@/lib/productOrder";
import { refreshStorefront } from "@/lib/revalidate";
import type { AdminCategory, CategoryProductOrderRow } from "@/types";

const rowBtn =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/5";

/** The batch bar's buttons, on its dark ground. */
const barBtn =
  "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Admin: a category page's own order under "Önerilen". Drag a product, or
 * send it to the top or the bottom — one, or every one ticked; every move is
 * saved at once. The ranked products lead the page; the rest follow by name;
 * the ones kept at the bottom close it — so a product added later falls in
 * between.
 */
export function AdminProductOrderView({
  embedded = false,
  initialCategoryId = null,
  onCategoryChange,
}: {
  /** In "Ürünler & Stok"'s tabs, under their heading: no heading of its own. */
  embedded?: boolean;
  /** The category to open on ("Bu Kategoriyi Sırala", or the address). */
  initialCategoryId?: number | null;
  /** Told of every category chosen, for the address. */
  onCategoryChange?: (categoryId: number | null) => void;
} = {}) {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId);
  const [rows, setRows] = useState<CategoryProductOrderRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  // The ticked products, for the batch bar; a category of its own each time.
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const selectAll = useRef<HTMLInputElement>(null);
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

  const order = rows ? orderOf(rows) : null;
  const ranked = order?.top ?? 0;
  const kept = order?.bottom ?? 0;
  const allTicked = !!rows && rows.length > 0 && rows.every((r) => selected.has(r.product_id));
  const someTicked = selected.size > 0 && !allTicked;
  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = someTicked;
  }, [someTicked]);

  /** Show `next` at once and save it behind. */
  function save(next: Order<CategoryProductOrderRow>, done: string) {
    if (categoryId === null || !rows) return;
    const before = rows;
    const id = categoryId;
    const { productIds, bottomIds } = orderRequest(next);
    setRows(withPositions(next));
    setResult(null);
    setSaving(true);
    pending.current += 1;
    queue.current = queue.current
      .then(() => adminSetCategoryProductOrder(id, productIds, bottomIds))
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

  /** A drag: ranked where it lands, or kept at the bottom when dropped among those (lib/productOrder). */
  function onReorder(next: CategoryProductOrderRow[], productId: string) {
    const row = next.find((r) => r.product_id === productId);
    if (order && row) save(dragged(order, next, productId), `${row.name} taşındı.`);
  }

  function pinToTop(row: CategoryProductOrderRow) {
    if (order) save(toTop(order, new Set([row.product_id])), `${row.name} en üste taşındı.`);
  }

  function pinToBottom(row: CategoryProductOrderRow) {
    if (order) save(toBottom(order, new Set([row.product_id])), `${row.name} en alta taşındı.`);
  }

  /** The ticked ones to the top or the bottom, in the order they stand; the ticks go with the move. */
  function moveTicked(where: "top" | "bottom") {
    if (!order || selected.size === 0) return;
    const n = selected.size;
    save(
      where === "top" ? toTop(order, selected) : toBottom(order, selected),
      where === "top" ? `${n} ürün en üste taşındı.` : `${n} ürün en alta taşındı.`,
    );
    setSelected(new Set());
  }

  function tick(productId: string) {
    setSelected((now) => {
      const next = new Set(now);
      if (!next.delete(productId)) next.add(productId);
      return next;
    });
  }

  function reset() {
    if (!rows || !window.confirm("Bu kategorinin sırası sıfırlansın mı? Ürünler ada göre listelenir.")) return;
    const byName = [...rows].sort((a, b) => a.name.localeCompare(b.name, "tr"));
    save({ rows: byName, top: 0, bottom: 0 }, "Sıra sıfırlandı: ürünler ada göre.");
  }

  const category = categories?.find((c) => c.id === categoryId);

  return (
    <>
      {!embedded && (
        <AdminPageHeader
          title="Ürün Sıralaması"
          description="Bir kategori sayfasındaki ürünlerin “Önerilen” sırası. Ürünü tutamaçtan sürükleyin ya da en üste / en alta taşıyın; birkaçını işaretleyip birlikte de taşıyabilirsiniz. Her değişiklik hemen kaydedilir. Sıraya alınmamış ürünler ada göre gelir; en alta taşınanlar, sonradan eklenen ürünler de dahil, hep en sonda kalır."
        />
      )}

      <section className={`${panelClass} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center dark:border-white/10">
          <label htmlFor="order-category" className="text-sm font-medium">
            Kategori
          </label>
          <CategoryCombobox
            id="order-category"
            categories={categories ?? []}
            value={categoryId}
            disabled={!categories}
            onChange={(id) => {
              if (id === categoryId) return;
              setRows(null);
              setResult(null);
              setSelected(new Set());
              setCategoryId(id);
              onCategoryChange?.(id);
            }}
          />
          {rows && (
            <div className="flex items-center gap-3 sm:ms-auto">
              <span className="text-xs text-slate-500 tabular-nums dark:text-zinc-400" aria-live="polite">
                {saving ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Kaydediliyor…
                  </span>
                ) : (
                  `${rows.length} ürün · ${ranked} sıralı${kept ? ` · ${kept} en altta` : ""}`
                )}
              </span>
              <button type="button" onClick={reset} disabled={ranked === 0 && kept === 0} className={rowBtn}>
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
          <>
            {/* Tick them all, or none. */}
            <div className="flex items-center gap-3 border-b border-slate-200 py-2 pe-4 ps-14 dark:border-white/10">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-300">
                <input
                  ref={selectAll}
                  type="checkbox"
                  checked={allTicked}
                  onChange={() => setSelected(allTicked ? new Set() : new Set(rows.map((r) => r.product_id)))}
                  className="h-4 w-4 cursor-pointer accent-red-600"
                />
                {allTicked ? "Tümünün seçimini kaldır" : `Tümünü seç (${rows.length})`}
              </label>
            </div>
            <SortableList
              items={rows}
              getId={(r) => r.product_id}
              getLabel={(r) => r.name}
              onReorder={onReorder}
              // Room under the last row for the batch bar while it is up.
              className={`divide-y divide-slate-200 dark:divide-white/10 ${selected.size > 0 ? "pb-36 sm:pb-20" : ""}`}
              renderItem={(r, handle, index) => {
                const firstKept = kept > 0 && index === rows.length - kept;
                const ticked = selected.has(r.product_id);
                return (
                  <div
                    className={`relative flex items-center gap-3 py-2.5 pe-4 ps-2 ${
                      (index === ranked && ranked > 0) || firstKept ? "border-t-2 border-dashed border-slate-300 dark:border-white/15" : ""
                    } ${ticked ? "bg-red-50/60 dark:bg-red-500/[0.07]" : ""}`}
                  >
                    {firstKept && (
                      <span className="pointer-events-none absolute -top-2.5 start-14 rounded bg-white px-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
                        En altta sabit
                      </span>
                    )}
                    {handle}
                    <input
                      type="checkbox"
                      checked={ticked}
                      onChange={() => tick(r.product_id)}
                      aria-label={`Seç: ${r.name}`}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-red-600"
                    />
                    <span
                      title={r.bottom ? "En altta sabit" : r.position === null ? "Sıralı değil: ada göre" : "Sıralı"}
                      className={`w-7 shrink-0 text-right font-mono text-xs tabular-nums ${
                        r.bottom
                          ? "font-semibold text-slate-600 dark:text-zinc-300"
                          : r.position === null
                            ? "text-slate-400 dark:text-zinc-500"
                            : "font-semibold text-red-600 dark:text-red-400"
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
                    <button
                      type="button"
                      onClick={() => pinToBottom(r)}
                      disabled={index === rows.length - 1 && r.bottom}
                      aria-label={`En alta taşı: ${r.name}`}
                      title="En alta taşı: yeni eklenen ürünler de üstünde kalır"
                      className={rowBtn}
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden />
                      <span className="max-sm:sr-only">En Alta Taşı</span>
                    </button>
                  </div>
                );
              }}
            />
          </>
        )}
      </section>

      {/* The ticked ones' moves, over the list's foot while anything is ticked. */}
      {rows && selected.size > 0 && (
        <div
          role="region"
          aria-label="Seçili ürünler"
          className="fixed inset-x-4 bottom-24 z-40 mx-auto sm:bottom-6 flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-white shadow-2xl ring-1 ring-white/10 dark:bg-zinc-800"
        >
          <span className="me-1 whitespace-nowrap text-sm font-semibold tabular-nums" aria-live="polite">
            <span className="sm:hidden">{selected.size} seçili</span>
            <span className="max-sm:hidden">{selected.size} ürün seçildi</span>
          </span>
          <button type="button" onClick={() => moveTicked("top")} aria-label="Seçilenleri En Üste Taşı" className={`${barBtn} bg-white text-zinc-900 hover:bg-zinc-200`}>
            <ArrowUpToLine className="h-3.5 w-3.5" aria-hidden />
            {/* Short on a phone, so the bar keeps to one line there. */}
            <span className="sm:hidden">En Üste</span>
            <span className="max-sm:hidden">Seçilenleri En Üste Taşı</span>
          </button>
          <button type="button" onClick={() => moveTicked("bottom")} aria-label="Seçilenleri En Alta Taşı" className={`${barBtn} bg-white/10 hover:bg-white/20`}>
            <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden />
            <span className="sm:hidden">En Alta</span>
            <span className="max-sm:hidden">Seçilenleri En Alta Taşı</span>
          </button>
          <button type="button" onClick={() => setSelected(new Set())} aria-label="Seçimi Temizle" className={`${barBtn} text-zinc-300 hover:bg-white/10 hover:text-white`}>
            <X className="h-3.5 w-3.5" aria-hidden />
            <span className="max-sm:hidden">Seçimi Temizle</span>
          </button>
        </div>
      )}
    </>
  );
}
