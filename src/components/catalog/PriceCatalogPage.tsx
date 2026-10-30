"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { useLocalePath } from "@/components/i18n/navigation";
import { LookbookDownload, LookbookPreview, type LookbookItem, type LookbookLine } from "@/components/lookbook/Lookbook";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDateParts } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { fetchAdminCatalogGroups, fetchPriceList, readCatalogRequest, type PriceListItem } from "@/lib/priceList";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { SegmentType } from "@/types";

/**
 * A product's plate. Toptan and Kafe rows carry the VAT split a business
 * buyer works with; the retail row is a shelf price, VAT-inclusive, as a
 * shopper reads it — its total only, nothing marked "+ KDV".
 */
function plateOf(item: PriceListItem, groups: SegmentType[], locale: Locale): LookbookItem {
  const lines = groups.flatMap<LookbookLine>((g) => {
    const p = item.prices[g];
    if (!p) return [];
    const excl = Number(p.price_excl_tax);
    const total = Number(p.price_incl_tax);
    const label = catalogMessages[locale].priceCatalog.groupLabel[g].toLocaleUpperCase(INTL_LOCALE[locale]);
    return g === "RETAIL"
      ? [{ key: g, label, excl, vat: 0, total, currency: "TRY", tone: "retail", totalOnly: true }]
      : [{ key: g, label, excl, vat: Math.round((total - excl) * 100) / 100, total, currency: "TRY" }];
  });
  return { id: item.product_id, code: item.code, name: item.name, imageUrl: item.image_url, lines };
}

/**
 * The price catalogue's preview: the "Fiyat Listesi" lookbook of the products
 * the customer (or an admin) had on screen, in the price groups they chose —
 * read on screen as a grid that fits any device, and downloaded with "PDF
 * İndir" as a real .pdf file of A4 pages, never through the print dialog
 * (which broke the pages on a phone). White-label: no logo, no contact block,
 * and the file named after the collection, not the shop.
 */
export function PriceCatalogPage({ requestKey }: { requestKey: string }) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState<PriceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();
  const router = useRouter();
  const to = useLocalePath();
  const t = useMessages(catalogMessages).priceCatalog;
  const request = useMemo(() => (typeof window === "undefined" ? null : readCatalogRequest(requestKey)), [requestKey]);
  const date = useMemo(() => formatDateParts(new Date().toISOString(), INTL_LOCALE[locale]).date, [locale]);

  useEffect(() => {
    if (!hydrated || !token || !request) return;
    const controller = new AbortController();
    // An admin's catalogue (any groups) comes from the admin endpoint.
    const rows = request.admin
      ? fetchAdminCatalogGroups(request.productIds, request.groups, controller.signal)
      : fetchPriceList(request.productIds, request.groups, controller.signal);
    rows
      .then(setItems)
      .catch((err) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, t.loadError));
      });
    return () => controller.abort();
  }, [hydrated, token, request, t.loadError]);

  const plates = useMemo(
    () => (items && request ? items.map((i) => plateOf(i, request.groups, locale)).filter((p) => p.lines.length > 0) : []),
    [items, request, locale],
  );

  /** Back to the grid the catalogue was made from, or to the catalog when this page was opened on its own. */
  function back() {
    if (window.history.length > 1) router.back();
    else router.push(to("/catalog"));
  }

  if (!hydrated) return <div className="h-96 rounded-2xl bg-foreground/[0.04] motion-safe:animate-pulse" aria-busy />;
  if (!token) return <Alert variant="error">{t.signIn}</Alert>;
  if (!request) {
    return <Alert variant="error">{t.missingRequest}</Alert>;
  }
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!items) return <div className="h-96 rounded-2xl bg-foreground/[0.04] motion-safe:animate-pulse" aria-busy />;
  if (!plates.length) return <Alert variant="error">{t.nothingPriced}</Alert>;

  const left = items.length - plates.length;
  // A chosen group a product has no price in is left off its plate; said here,
  // so a group missing from the file is never a surprise.
  const unpriced = request.groups
    .map((g) => ({ group: g, count: items.filter((i) => !i.prices[g]).length }))
    .filter((m) => m.count > 0);
  return (
    <>
      {/* The download stays in reach while the preview scrolls (on a phone, a long way). */}
      <div className="sticky top-[var(--header-height,0px)] z-10 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {t.back}
        </button>
        <LookbookDownload
          collection={request.collection}
          date={date}
          items={plates}
          fileTitle={t.documentTitle(request.collection, date)}
          labels={{ download: t.savePdf, preparing: t.preparing, failed: t.pdfFailed }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 disabled:cursor-wait disabled:opacity-80"
        />
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {t.summary(plates.length.toLocaleString(INTL_LOCALE[locale]), request.groups)}
        {left > 0 && t.skipped(left)}
        {t.printHint}
      </p>
      {unpriced.length > 0 && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {unpriced.map((m) => t.groupUnpriced(m.group, m.count, items.length)).join(" ")}
        </p>
      )}
      <LookbookPreview collection={request.collection} date={date} items={plates} />
    </>
  );
}
