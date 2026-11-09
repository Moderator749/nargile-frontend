"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LookbookDownload, LookbookPreview, type LookbookItem, type LookbookLine } from "@/components/lookbook/Lookbook";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDateParts } from "@/lib/format";
import { CATALOG_SEGMENTS, erpPriceFor, rowCatalogPrice, splitVat, type CatalogSegment } from "@/lib/erpCatalog";
import { fetchAllPricingRecords, SEGMENT_LABELS, type PricingRecord } from "@/lib/pricing";

/** A price row of the catalogue: a customer group (by its code), retail, or the TL decision. */
interface CatalogColumn {
  key: string;
  label: string;
}
const RETAIL = "__retail";
const FINAL = "__final";

/**
 * A saved row as a lookbook plate. Each group's price is split before and
 * after VAT whatever the sheet's basis: a class on a before-VAT sheet
 * (Cetvel 1) is before VAT; retail, the TL decision and every class on an
 * after-VAT sheet (Cetvel 2) are after it.
 *
 * A group's base is an ERP price — the product's, else the row's own blue
 * "ERP fiyatı", before VAT on every sheet — else the product's KDV hariç price in "Fiyat Tablosu", and
 * the row's green price only where none of those exists (`rowCatalogPrice`).
 * Not the TL decision, which is the row's. Each group shows its price as the
 * product chose: only before VAT, only after it, or, unchosen, the full split.
 */
function plateOf(record: PricingRecord, columns: CatalogColumn[]): LookbookItem {
  const s = record.sheet;
  const vatRate = Number(s.retail.vat_rate);
  const lines = columns.flatMap((column): LookbookLine[] => {
    if (column.key === FINAL) {
      if (s.final_try === null) return [];
      return [{ key: column.key, label: column.label, currency: "TRY", tone: "final", ...splitVat(Number(s.final_try), vatRate, false) }];
    }
    const segment: CatalogSegment = column.key === RETAIL ? "RETAIL" : (column.key as CatalogSegment);
    const own = segment === "RETAIL" ? s.retail : s.columns.find((c) => c.segment === segment);
    // A class's green price is in the sheet's own basis, retail's after VAT; the blue ERP fiyatı is always before it.
    const beforeVat = segment !== "RETAIL" && s.vat_mode === "EXCL";
    const price = rowCatalogPrice({
      product: record.product_erp ?? null,
      segment,
      currency: s.currency,
      rowErp: own?.erp_price == null ? null : Number(own.erp_price),
      rowErpBeforeVat: true,
      rowPrice: own?.price == null ? null : Number(own.price),
      rowPriceBeforeVat: beforeVat,
      rowVatRate: vatRate,
    });
    if (price === null) return [];
    return [
      {
        key: column.key,
        label: column.label,
        tone: segment === "RETAIL" ? "retail" : undefined,
        totalOnly: price.display === true,
        exclOnly: price.display === false,
        currency: price.currency,
        excl: price.excl,
        vat: price.vat,
        total: price.total,
      },
    ];
  });
  return {
    id: record.id,
    code: record.product_code,
    name: record.product_name,
    imageUrl: record.image_url,
    rates: s.currency !== "TRY" ? { usd: s.usd_rate, eur: s.eur_rate } : undefined,
    lines,
  };
}

/**
 * The price catalogue ("Fiyat Listesi") for rows picked in a pricing file: a
 * column picker, a preview, and "PDF İndir", which downloads the A4 file
 * itself (no print dialog).
 */
export function PricingCatalogView({ ids }: { ids: string[] }) {
  const [records, setRecords] = useState<PricingRecord[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const date = useMemo(() => formatDateParts(new Date().toISOString()).date, []);
  const idKey = ids.join(",");

  useEffect(() => {
    if (!idKey) return;
    const controller = new AbortController();
    const wanted = new Set(idKey.split(","));
    fetchAllPricingRecords(controller.signal)
      .then((rows) => {
        const mine = rows.filter((r) => wanted.has(r.id)).reverse(); // oldest first: the order they were priced
        setRecords(mine);
        // The rows' file names the catalogue (rows of several, or none: no name).
        const names = new Set(mine.map((r) => r.file_name));
        setFileName(names.size === 1 ? ([...names][0] ?? "") : "");
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Katalog yüklenemedi."));
      });
    return () => controller.abort();
  }, [idKey]);

  // The customer groups the picked rows price — Bayi, Toptan, Kafe, in that
  // order — then retail and the TL decision. A column that writes to no group
  // (an intermediate step such as "Mağaza") is the shop's arithmetic, not a
  // price a customer is quoted, so it is never in the catalogue.
  const allColumns = useMemo<CatalogColumn[]>(() => {
    // A group the row prices, or its product does: by an ERP price or in its
    // price table, in the row's currency.
    const groups = new Set(
      (records ?? []).flatMap((r) => {
        const product = r.product_erp;
        const own = r.sheet.columns.map((c) => c.segment).filter(Boolean);
        if (!product) return own;
        const erp = CATALOG_SEGMENTS.filter((g) => erpPriceFor(product.erp_prices, r.sheet.currency, g));
        return [...own, ...erp, ...Object.keys(product.prices_excl?.[r.sheet.currency] ?? {})];
      }),
    );
    const cols: CatalogColumn[] = (["DEALER", "WHOLESALE", "CAFE"] as const)
      .filter((g) => groups.has(g))
      .map((g) => ({ key: g, label: SEGMENT_LABELS[g].toLocaleUpperCase("tr-TR") }));
    cols.push({ key: RETAIL, label: "PERAKENDE" });
    if ((records ?? []).some((r) => r.sheet.final_try)) cols.push({ key: FINAL, label: "SON KARAR" });
    return cols;
  }, [records]);
  const columns = allColumns.filter((c) => !hidden.has(c.key));

  if (ids.length === 0) {
    return <Alert variant="error">Katalog için bir dosyadan en az bir satır seçin.</Alert>;
  }
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!records) return <div className="h-96 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />;

  const plates = records.map((r) => plateOf(r, columns));
  return (
    <>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/pricing-calculator"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Fiyat Hesaplama Cetveli
        </Link>
        <LookbookDownload
          collection={fileName}
          date={date}
          items={plates}
          fileTitle={["Sultan Nargile Fiyat Kataloğu", fileName, date].filter(Boolean).join(" - ")}
          labels={{
            download: "PDF İndir",
            preparing: (done, total) => `PDF hazırlanıyor… ${done}/${total}`,
            failed: "PDF oluşturulamadı. Lütfen tekrar deneyin.",
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-wait disabled:opacity-80"
        />
      </div>

      <fieldset className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Katalogda gösterilecek fiyatlar
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {allColumns.map((c) => (
            <label key={c.key} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-red-600"
                checked={!hidden.has(c.key)}
                onChange={() =>
                  setHidden((h) => {
                    const next = new Set(h);
                    if (!next.delete(c.key)) next.add(c.key);
                    return next;
                  })
                }
              />
              {c.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
          Müşteriye göre seçin: örneğin bir kafeye yalnızca Kafe ve Perakende fiyatlarını gönderin. “PDF İndir” dosyayı
          A4 sayfalar halinde, katalog adıyla indirir.
        </p>
      </fieldset>

      <LookbookPreview collection={fileName} date={date} items={plates} />
    </>
  );
}
