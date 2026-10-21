"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FileDown } from "lucide-react";

import Link from "@/components/i18n/Link";
import { Lookbook, PrintableLookbook, printLookbook, type LookbookItem, type LookbookLine } from "@/components/lookbook/Lookbook";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDateParts } from "@/lib/format";
import { CATALOG_GROUP_LABELS, fetchAdminCatalog, fetchPriceList, readCatalogRequest, type PriceListItem } from "@/lib/priceList";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { SegmentType } from "@/types";

/**
 * A product's plate. Toptan and Kafe rows carry the VAT split a business
 * buyer works with; the retail row is a shelf price, VAT-inclusive, as a
 * shopper reads it — its total only, nothing marked "+ KDV".
 */
function plateOf(item: PriceListItem, groups: SegmentType[]): LookbookItem {
  const lines = groups.flatMap<LookbookLine>((g) => {
    const p = item.prices[g];
    if (!p) return [];
    const excl = Number(p.price_excl_tax);
    const total = Number(p.price_incl_tax);
    const label = CATALOG_GROUP_LABELS[g].toLocaleUpperCase("tr-TR");
    return g === "RETAIL"
      ? [{ key: g, label, excl, vat: 0, total, currency: "TRY", tone: "retail", totalOnly: true }]
      : [{ key: g, label, excl, vat: Math.round((total - excl) * 100) / 100, total, currency: "TRY" }];
  });
  return { id: item.product_id, code: item.code, name: item.name, imageUrl: item.image_url, lines };
}

/**
 * The B2B price catalogue, printed: the "Fiyat Listesi" lookbook of the
 * products the customer had on screen, in the price groups they chose. It
 * opens the print dialog by itself once the photos are in; the button does it
 * again. White-label: no logo, no contact block, and the file named after the
 * collection, not the shop.
 */
export function PriceCatalogPage({ requestKey }: { requestKey: string }) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState<PriceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printed = useRef(false);
  const request = useMemo(() => (typeof window === "undefined" ? null : readCatalogRequest(requestKey)), [requestKey]);
  const date = useMemo(() => formatDateParts(new Date().toISOString()).date, []);

  useEffect(() => {
    if (!hydrated || !token || !request) return;
    const controller = new AbortController();
    // An admin's catalogue (one group, any group) comes from the admin endpoint.
    const rows = request.admin
      ? fetchAdminCatalog(request.productIds, request.groups[0], controller.signal)
      : fetchPriceList(request.productIds, request.groups, controller.signal);
    rows
      .then(setItems)
      .catch((err) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Katalog hazırlanamadı."));
      });
    return () => controller.abort();
  }, [hydrated, token, request]);

  const plates = useMemo(
    () => (items && request ? items.map((i) => plateOf(i, request.groups)).filter((p) => p.lines.length > 0) : []),
    [items, request],
  );

  // The saved PDF is named after the page's title: the collection, not the
  // shop. Set once the catalogue is in, after the page's own title has been.
  const ready = plates.length > 0;
  useEffect(() => {
    if (!request || !ready) return;
    const before = document.title;
    document.title = `Fiyat Listesi - ${request.collection} - ${date}`;
    return () => {
      document.title = before;
    };
  }, [request, date, ready]);

  // Straight to the print dialog, once, when the catalogue is ready.
  useEffect(() => {
    if (!plates.length || printed.current) return;
    printed.current = true;
    const t = setTimeout(() => void printLookbook(), 300);
    return () => clearTimeout(t);
  }, [plates]);

  if (!hydrated) return <div className="h-96 rounded-2xl bg-foreground/[0.04] motion-safe:animate-pulse" aria-busy />;
  if (!token) return <Alert variant="error">Fiyat kataloğu için giriş yapın.</Alert>;
  if (!request) {
    return <Alert variant="error">Katalog bilgisi bulunamadı. Ürünler sayfasından “Fiyat Kataloğu İndir” ile yeniden oluşturun.</Alert>;
  }
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!items) return <div className="h-96 rounded-2xl bg-foreground/[0.04] motion-safe:animate-pulse" aria-busy />;
  if (!plates.length) return <Alert variant="error">Seçilen fiyat grubunda fiyatı olan ürün yok.</Alert>;

  const sheet = <Lookbook collection={request.collection} date={date} items={plates} />;
  const left = items.length - plates.length;
  return (
    <>
      <PrintableLookbook>{sheet}</PrintableLookbook>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Ürünler
        </Link>
        <button
          type="button"
          onClick={() => void printLookbook()}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500"
        >
          <FileDown className="h-4 w-4" aria-hidden /> PDF olarak kaydet
        </button>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {plates.length.toLocaleString("tr-TR")} ürün · {request.groups.map((g) => CATALOG_GROUP_LABELS[g]).join(" ve ")} fiyatları.
        {left > 0 && ` Bu fiyat grubunda fiyatı olmayan ${left} ürün kataloğa alınmadı.`} Yazdırma penceresinde Hedef olarak
        “PDF olarak kaydet”i seçin.
      </p>
      {/* The preview: the same sheet, on a white page. */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-white p-6 shadow-sm">{sheet}</div>
    </>
  );
}
