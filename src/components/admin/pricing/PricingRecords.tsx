"use client";

import { CheckCircle2, ImageOff, RotateCcw, Trash2 } from "lucide-react";

import { formatDate } from "@/lib/format";
import type { PricingCurrency, PricingRecord, StoredColumn } from "@/lib/pricing";

const SYMBOL: Record<PricingCurrency, string> = { TRY: "₺", USD: "$", EUR: "€" };
const money = (v: string | null, c: PricingCurrency) =>
  v === null ? "—" : `${SYMBOL[c]}${Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The product's photo, or a quiet placeholder when it has none. */
/** What a saved column shows here: the ERP fiyatı typed, else the calculated price. */
const erpOf = (col: StoredColumn) => col.erp_price ?? col.computed;

export function Thumb({ src, alt, size = "h-14 w-14" }: { src: string | null; alt: string; size?: string }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5`}>
      {src ? (
        // Catalogue photos come from the shop's own media and from its old
        // site; a plain img takes either without an image-domain list.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-contain p-1" />
      ) : (
        <ImageOff className="h-5 w-5 text-slate-300 dark:text-zinc-600" aria-hidden />
      )}
    </span>
  );
}

/**
 * Saved worksheet rows, newest first: each class's price, and whether it
 * reached the site. With `selected`, each row has a checkbox (a file's rows,
 * picked for a price catalogue).
 */
export function PricingRecords({
  records,
  empty,
  onLoad,
  onDelete,
  selected,
  onToggle,
}: {
  records: PricingRecord[] | null;
  empty: string;
  onLoad: (record: PricingRecord) => void;
  onDelete: (record: PricingRecord) => void;
  selected?: ReadonlySet<string>;
  onToggle?: (record: PricingRecord) => void;
}) {
  if (records === null) {
    return <div className="h-40 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />;
  }
  if (records.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/15 dark:text-zinc-400">
        {empty}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {records.map((r) => {
        const s = r.sheet;
        const c = s.currency;
        return (
          <li
            key={r.id}
            className={`rounded-2xl border bg-white p-4 transition-colors dark:bg-zinc-900 ${
              selected?.has(r.id) ? "border-red-300 ring-1 ring-red-200 dark:border-red-500/40 dark:ring-red-500/20" : "border-slate-200 dark:border-white/10"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {selected && onToggle && (
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => onToggle(r)}
                    aria-label={`${r.product_code || r.product_name || "Satır"} kataloğa ekle`}
                    className="h-4 w-4 shrink-0 accent-red-600"
                  />
                )}
                <Thumb src={r.image_url} alt={r.product_name || r.product_code} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {r.product_code && <span className="mr-2 font-mono text-slate-500 dark:text-zinc-400">{r.product_code}</span>}
                  {r.product_name || "Adsız ürün"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  {formatDate(r.created_at)} ·{" "}
                  {s.vat_mode === "EXCL" ? (
                    `KDV hariç · ${c}`
                  ) : (
                    // The basis every figure on the card is in: missed, a price is read 20% off.
                    <span className="font-bold text-red-600 dark:text-red-400">KDV dahil · {c}</span>
                  )}
                  {r.file_name && ` · ${r.file_name}`}
                </p>
              </div>
              </div>
              <div className="flex items-center gap-2">
                {r.applied_at && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
                    title={`Siteye uygulandı: ${formatDate(r.applied_at)}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Sitede
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onLoad(r)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:text-zinc-300 dark:ring-white/15 dark:hover:bg-white/5"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Cetvele yükle
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(r)}
                  aria-label="Kaydı sil"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            <dl className="mt-3 flex flex-wrap gap-2 text-xs">
              {/* The two ends of the sheet in red, cost and retail, the classes
                  between them plain; the cost's own figure muted, being the
                  input rather than a price anyone pays. Each column shows its
                  ERP fiyatı — the admin's own base — else its calculated
                  price, not the price sent to the site. */}
              {[
                { label: "Maliyet", price: s.cost, kind: "cost" as const },
                ...s.columns.map((col) => ({ label: col.label, price: erpOf(col), kind: "plain" as const })),
                ...(s.extras ?? []).map((extra) => ({ label: extra.label, price: erpOf(extra), kind: "plain" as const })),
                { label: "Perakende", price: erpOf(s.retail), kind: "retail" as const },
              ].map((cell, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-2.5 py-1.5 ${
                    cell.kind === "plain"
                      ? "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-zinc-300"
                      : "bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-100"
                  }`}
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{cell.label}</dt>
                  <dd
                    className={`font-mono tabular-nums ${
                      cell.kind === "cost" ? "font-medium text-slate-500 dark:text-zinc-400" : "font-semibold"
                    }`}
                  >
                    {money(cell.price, c)}
                  </dd>
                </div>
              ))}
              {s.final_try && (
                <div className="rounded-lg bg-red-600 px-2.5 py-1.5 text-white">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Son karar</dt>
                  <dd className="font-mono font-semibold tabular-nums">{money(s.final_try, "TRY")}</dd>
                </div>
              )}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
