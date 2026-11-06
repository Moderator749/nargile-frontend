"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileDown, Loader2, RotateCw, X } from "lucide-react";

import { type CatalogListing, useCatalogListing } from "@/components/catalog/useCatalogListing";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { useLocalePath } from "@/components/i18n/navigation";
import { catalogParts } from "@/lib/catalogParts";
import { isExportAccount } from "@/lib/exportAccount";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import {
  CATALOG_CHOICES,
  PRICE_LIST_MAX,
  isB2BSegment,
  storeCatalogRequest,
} from "@/lib/priceList";
import { useAuthStore } from "@/store/useAuthStore";
import type { SegmentType } from "@/types";

/**
 * "Fiyat Kataloğu İndir": the listing whole — the category, the brand or the
 * search, through every filter as it stands and in the grid's order, however
 * much of it "Daha fazla göster" has loaded — as a white-label PDF price
 * catalogue for a B2B account to send its own customers; over 200 products,
 * in parts of 200, a button each.
 *
 * Only for Bayi, Toptan and Kafe accounts, and each is offered only the price
 * groups below its own (a dealer must not hand a café its dealer price): the
 * dialog shows those, one or several at once (each product's plate then lists
 * them one under another), and the server refuses anything else.
 */
export function PriceCatalogExport({ listing, collection }: { listing: CatalogListing; collection: string }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const t = useMessages(catalogMessages).priceCatalog;
  const segment = user?.segment_code;
  if (!user || !isB2BSegment(segment) || isExportAccount(user)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={listing.products.length === 0}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-600 bg-red-600 px-3 text-[11px] max-md:w-9 max-md:justify-center max-md:px-0 font-bold uppercase tracking-wider text-white shadow-sm transition-colors duration-200 hover:border-red-500 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FileDown className="h-3.5 w-3.5" aria-hidden />
        {/* The icon alone in a phone's filter strip; its name stays for screen readers. */}
        <span className="max-md:sr-only">{t.download}</span>
      </button>
      {open && (
        <ExportDialog
          choice={CATALOG_CHOICES[segment]}
          listing={listing}
          collection={collection}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ExportDialog({
  choice,
  listing,
  collection,
  onClose,
}: {
  choice: (typeof CATALOG_CHOICES)[keyof typeof CATALOG_CHOICES];
  listing: CatalogListing;
  collection: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const to = useLocalePath();
  const router = useRouter();
  const t = useMessages(catalogMessages).priceCatalog;
  const [picked, setPicked] = useState<ReadonlySet<SegmentType>>(() => new Set("pick" in choice ? choice.pick.slice(0, 1) : []));
  // In the plate's order (Toptan, Kafe, Perakende), whatever order they were ticked in.
  const groups = "fixed" in choice ? choice.fixed : choice.pick.filter((g) => picked.has(g));
  const state = useCatalogListing(listing);
  const products = state.status === "ready" ? state.products : [];
  const parts = catalogParts(products.length, PRICE_LIST_MAX);
  const number = (n: number) => n.toLocaleString(INTL_LOCALE[locale]);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("input, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(group: SegmentType) {
    setPicked((now) => {
      const next = new Set(now);
      if (!next.delete(group)) next.add(group);
      return next;
    });
  }

  /** Part `n` of the catalogue (the only one, up to 200 products); the preview can go on to the others. */
  function create(n: number) {
    if (groups.length === 0 || products.length === 0) return;
    const key = storeCatalogRequest({ productIds: products.map((p) => p.id), groups, collection });
    // To the preview, in the page's language and in this tab (a phone handles a
    // second tab badly); "PDF İndir" there makes the file.
    onClose();
    router.push(to(`/fiyat-katalogu?k=${key}${parts.length > 1 ? `&bolum=${n}` : ""}`));
  }

  const createButton =
    "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50";

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
            {t.title}
          </h2>
          <button type="button" onClick={onClose} aria-label={t.close} className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/[0.06]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {"pick" in choice ? (
          <fieldset className="mt-4">
            <legend className="text-sm text-muted-foreground">{t.whichGroup}</legend>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.severalGroups}</p>
            <div className="mt-3 space-y-2">
              {choice.pick.map((g) => {
                const on = picked.has(g);
                return (
                  <label
                    key={g}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-red-600 ${
                      on ? "border-red-500 bg-red-50/60 dark:bg-red-500/10" : "border-border hover:bg-foreground/[0.03]"
                    }`}
                  >
                    <input type="checkbox" value={g} checked={on} onChange={() => toggle(g)} className="sr-only" />
                    <span
                      aria-hidden
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-red-600 bg-red-600 text-white" : "border-slate-400"}`}
                    >
                      {on && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    {t.groupPrices(g)}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <p className="mt-4 rounded-xl bg-foreground/[0.04] px-4 py-3 text-sm leading-relaxed">
            {t.cafeFixed}
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground" aria-live="polite">
          {state.status === "loading" ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> {t.counting}
            </span>
          ) : state.status === "error" ? (
            <span className="flex flex-wrap items-center gap-x-2 text-red-600 dark:text-red-400">
              {t.listFailed}
              <button type="button" onClick={state.retry} className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline">
                <RotateCw className="h-3 w-3" aria-hidden /> {t.retry}
              </button>
            </span>
          ) : (
            <>
              {t.total(listing.scope, number(products.length))}
              {parts.length > 1 && t.inParts(PRICE_LIST_MAX, parts.length)}
            </>
          )}{" "}
          {t.newTab}
        </p>

        {state.status === "ready" && parts.length > 1 && (
          // Over 200 products: a button a part, the preview going on from one to the next.
          <div role="group" aria-label={t.parts} className="mt-5 grid gap-2">
            {parts.map((part) => (
              <button key={part.n} type="button" onClick={() => create(part.n)} disabled={groups.length === 0} className={createButton}>
                <FileDown className="h-4 w-4" aria-hidden /> {t.part(part.n, number(part.from), number(part.to))}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium ring-1 ring-inset ring-border hover:bg-foreground/[0.04]"
          >
            {t.cancel}
          </button>
          {!(state.status === "ready" && parts.length > 1) && (
            <button
              type="button"
              onClick={() => create(1)}
              disabled={state.status !== "ready" || groups.length === 0 || products.length === 0}
              aria-busy={state.status === "loading"}
              className={createButton}
            >
              {state.status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t.gathering}
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" aria-hidden /> {groups.length === 0 ? t.pickOne : t.create}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
