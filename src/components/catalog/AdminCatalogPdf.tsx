"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileDown, ShieldCheck, X } from "lucide-react";

import { isAdminRole } from "@/lib/roles";
import { ADMIN_CATALOG_GROUPS, CATALOG_GROUP_LABELS, PRICE_LIST_MAX, storeCatalogRequest } from "@/lib/priceList";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, SegmentType } from "@/types";

/**
 * Whether the visitor is signed in as an admin. False on the server and until
 * the saved session has loaded, so nothing admin-only is in the page's HTML or
 * flashes up for anyone else. The server checks again for whatever it serves.
 */
export function useIsAdmin(): boolean {
  const hydrated = useAuthHydrated();
  const role = useAuthStore((s) => s.user?.role);
  return hydrated && isAdminRole(role);
}

/**
 * "PDF Oluştur", for an admin only, on the catalog's grid (catalog, category,
 * brand and search pages — not the homepage's sections): the products as
 * shown, as the printable price catalogue a B2B account downloads, at the
 * prices of whichever group the admin picks — Bayi, Toptan, Kafe or
 * Perakende. The catalogue opens in a new tab, ready for "PDF olarak kaydet".
 *
 * Renders nothing at all for anyone else (or for an empty grid), so it takes
 * no room in the layout.
 */
export function AdminCatalogPdf({
  products,
  collection,
  hasMore = false,
}: {
  /** The grid as shown: filtered and sorted. */
  products: CatalogProduct[];
  /** The catalogue's collection line: the category, the brand or the search. */
  collection: string;
  /** More products behind "Daha fazla göster" that are not on screen yet. */
  hasMore?: boolean;
}) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  if (!isAdmin || products.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Yalnızca adminler görür"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-red-500/70 bg-white px-3.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-red-400/60 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10"
      >
        <FileDown className="h-3.5 w-3.5" aria-hidden /> PDF Oluştur
      </button>
      {open &&
        createPortal(
          <GroupDialog products={products} collection={collection} hasMore={hasMore} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}

/** The one question: which group's prices. A click on a group opens its catalogue. */
function GroupDialog({
  products,
  collection,
  hasMore,
  onClose,
}: {
  products: CatalogProduct[];
  collection: string;
  hasMore: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const count = Math.min(products.length, PRICE_LIST_MAX);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("[data-group]")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function create(group: SegmentType) {
    const key = storeCatalogRequest({
      productIds: products.slice(0, PRICE_LIST_MAX).map((p) => p.id),
      groups: [group],
      collection,
      admin: true,
    });
    window.open(`/fiyat-katalogu?k=${key}`, "_blank", "noopener");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-background p-6 text-left text-foreground shadow-2xl ring-1 ring-border"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <ShieldCheck className="h-3 w-3" aria-hidden /> Admin
            </p>
            <h2 id={titleId} className="mt-0.5 text-lg font-semibold tracking-tight">
              PDF Oluştur
            </h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{collection}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/[0.06]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <p className="mt-4 text-sm font-medium">Hangi fiyat grubu için katalog oluşturulsun?</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ADMIN_CATALOG_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              data-group={group}
              onClick={() => create(group)}
              className="flex h-12 items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            >
              {CATALOG_GROUP_LABELS[group]}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Ekrandaki {count.toLocaleString("tr-TR")} ürün, gördüğünüz sırayla kataloğa eklenir.
          {products.length > PRICE_LIST_MAX && ` Bir katalog en fazla ${PRICE_LIST_MAX} ürün alır; ilk ${PRICE_LIST_MAX} ürün eklenecek.`}
          {hasMore && " Listede henüz yüklenmemiş ürünler var; onları da eklemek için önce “Daha fazla göster” ile yükleyin."}{" "}
          Fiyatlar grubun liste fiyatlarıdır (fırsat indirimleri hariç). Katalog yeni sekmede açılır; “PDF olarak kaydet” ile indirin.
        </p>
      </div>
    </div>
  );
}
