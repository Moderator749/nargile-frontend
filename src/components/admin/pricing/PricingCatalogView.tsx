"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LookbookDownload, LookbookPreview, splitVat, type LookbookItem } from "@/components/lookbook/Lookbook";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDateParts } from "@/lib/format";
import { fetchPricingFiles, fetchPricingRecords, SEGMENT_LABELS, type PricingRecord } from "@/lib/pricing";

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
 */
function plateOf(record: PricingRecord, columns: CatalogColumn[]): LookbookItem {
  const s = record.sheet;
  const vatRate = Number(s.retail.vat_rate);
  const lines = columns.flatMap((column) => {
    let amount: string | null;
    let currency = s.currency;
    let beforeVat = false;
    if (column.key === FINAL) {
      amount = s.final_try;
      currency = "TRY";
    } else if (column.key === RETAIL) {
      amount = s.retail.price;
    } else {
      amount = s.columns.find((c) => c.segment === column.key)?.price ?? null;
      beforeVat = s.vat_mode === "EXCL";
    }
    if (amount === null) return [];
    const tone = column.key === RETAIL ? ("retail" as const) : column.key === FINAL ? ("final" as const) : undefined;
    return [{ key: column.key, label: column.label, currency, tone, ...splitVat(Number(amount), vatRate, beforeVat) }];
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
export function PricingCatalogView({ fileId, ids }: { fileId: number | null; ids: string[] }) {
  const [records, setRecords] = useState<PricingRecord[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const date = useMemo(() => formatDateParts(new Date().toISOString()).date, []);
  const idKey = ids.join(",");

  useEffect(() => {
    if (fileId === null) return;
    const controller = new AbortController();
    const wanted = new Set(idKey.split(","));
    Promise.all([fetchPricingRecords(fileId, controller.signal), fetchPricingFiles(controller.signal)])
      .then(([rows, files]) => {
        setRecords(rows.filter((r) => wanted.has(r.id)).reverse()); // oldest first: the order they were priced
        setFileName(files.find((f) => f.id === fileId)?.name ?? "");
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Katalog yüklenemedi."));
      });
    return () => controller.abort();
  }, [fileId, idKey]);

  // The customer groups the picked rows price — Bayi, Toptan, Kafe, in that
  // order — then retail and the TL decision. A column that writes to no group
  // (an intermediate step such as "Mağaza") is the shop's arithmetic, not a
  // price a customer is quoted, so it is never in the catalogue.
  const allColumns = useMemo<CatalogColumn[]>(() => {
    const groups = new Set((records ?? []).flatMap((r) => r.sheet.columns.map((c) => c.segment).filter(Boolean)));
    const cols: CatalogColumn[] = (["DEALER", "WHOLESALE", "CAFE"] as const)
      .filter((g) => groups.has(g))
      .map((g) => ({ key: g, label: SEGMENT_LABELS[g].toLocaleUpperCase("tr-TR") }));
    cols.push({ key: RETAIL, label: "PERAKENDE" });
    if ((records ?? []).some((r) => r.sheet.final_try)) cols.push({ key: FINAL, label: "SON KARAR" });
    return cols;
  }, [records]);
  const columns = allColumns.filter((c) => !hidden.has(c.key));

  if (fileId === null || ids.length === 0) {
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
          fileTitle={`Sultan Nargile Fiyat Kataloğu - ${fileName} - ${date}`}
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
