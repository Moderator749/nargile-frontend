"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FileDown, X } from "lucide-react";

import { isExportAccount } from "@/lib/exportAccount";
import {
  CATALOG_CHOICES,
  CATALOG_GROUP_LABELS,
  PRICE_LIST_MAX,
  isB2BSegment,
  storeCatalogRequest,
} from "@/lib/priceList";
import { useAuthStore } from "@/store/useAuthStore";
import type { CatalogProduct, SegmentType } from "@/types";

/**
 * "Fiyat Kataloğu İndir": the products on screen — the category, the search
 * and every filter as they stand, in the grid's order — as a white-label PDF
 * price catalogue for a B2B account to send its own customers.
 *
 * Only for Bayi, Toptan and Kafe accounts, and each is offered only the price
 * groups below its own (a dealer must not hand a café its dealer price): the
 * dialog shows those, and the server refuses anything else.
 */
export function PriceCatalogExport({
  products,
  collection,
  hasMore,
}: {
  /** The grid as shown: filtered and sorted. */
  products: CatalogProduct[];
  collection: string;
  /** More products behind "Daha fazla göster" that are not on screen yet. */
  hasMore: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const segment = user?.segment_code;
  if (!user || !isB2BSegment(segment) || isExportAccount(user)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={products.length === 0}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-600 bg-red-600 px-3 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors duration-200 hover:border-red-500 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FileDown className="h-3.5 w-3.5" aria-hidden /> Fiyat Kataloğu İndir
      </button>
      {open && (
        <ExportDialog
          choice={CATALOG_CHOICES[segment]}
          products={products}
          collection={collection}
          hasMore={hasMore}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ExportDialog({
  choice,
  products,
  collection,
  hasMore,
  onClose,
}: {
  choice: (typeof CATALOG_CHOICES)[keyof typeof CATALOG_CHOICES];
  products: CatalogProduct[];
  collection: string;
  hasMore: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<SegmentType | null>("pick" in choice ? choice.pick[0] : null);
  const groups = "fixed" in choice ? choice.fixed : picked ? [picked] : [];
  const count = Math.min(products.length, PRICE_LIST_MAX);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("input, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function create() {
    if (groups.length === 0) return;
    const key = storeCatalogRequest({
      productIds: products.slice(0, PRICE_LIST_MAX).map((p) => p.id),
      groups,
      collection,
    });
    window.open(`/fiyat-katalogu?k=${key}`, "_blank", "noopener");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-background p-6 text-foreground shadow-2xl ring-1 ring-border"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            Fiyat kataloğu oluştur
          </h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/[0.06]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {"pick" in choice ? (
          <fieldset className="mt-4">
            <legend className="text-sm text-muted-foreground">Hangi fiyat grubuna göre katalog oluşturulsun?</legend>
            <div className="mt-3 space-y-2">
              {choice.pick.map((g) => (
                <label
                  key={g}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    picked === g ? "border-red-500 bg-red-50/60 dark:bg-red-500/10" : "border-border hover:bg-foreground/[0.03]"
                  }`}
                >
                  <input
                    type="radio"
                    name="catalog-group"
                    value={g}
                    checked={picked === g}
                    onChange={() => setPicked(g)}
                    className="h-4 w-4 accent-red-600"
                  />
                  {CATALOG_GROUP_LABELS[g]} Fiyatları
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="mt-4 rounded-xl bg-foreground/[0.04] px-4 py-3 text-sm leading-relaxed">
            Kafe alış fiyatlarınızı ve müşterileriniz için Perakende satış fiyatlarını içeren kataloğunuz hazırlanacaktır.
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Ekrandaki {count.toLocaleString("tr-TR")} ürün, gördüğünüz sırayla kataloğa eklenir.
          {products.length > PRICE_LIST_MAX && ` Bir katalog en fazla ${PRICE_LIST_MAX} ürün alır; ilk ${PRICE_LIST_MAX} ürün eklenecek.`}
          {hasMore && " Listede henüz yüklenmemiş ürünler var; onları da eklemek için önce “Daha fazla göster” ile yükleyin."}{" "}
          Katalog yeni sekmede açılır; “PDF olarak kaydet” ile indirin.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium ring-1 ring-inset ring-border hover:bg-foreground/[0.04]"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={create}
            disabled={groups.length === 0}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" aria-hidden /> Kataloğu oluştur
          </button>
        </div>
      </div>
    </div>
  );
}
