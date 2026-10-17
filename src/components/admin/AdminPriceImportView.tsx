"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, RotateCcw } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { useFileDrop } from "@/components/admin/useFileDrop";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { adminImportPrices } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { refreshStorefront } from "@/lib/revalidate";
import type { PriceImportMatched, PriceImportResult, PriceImportRow, PriceImportSkipped, PriceImportUnmatched, SegmentType } from "@/types";

const MAX_BYTES = 10 * 1024 * 1024;

/** The workbook's order, left to right. */
const GROUPS: { key: SegmentType; label: string }[] = [
  { key: "DEALER", label: "Bayi" },
  { key: "WHOLESALE", label: "Toptan" },
  { key: "CAFE", label: "Kafe" },
  { key: "RETAIL", label: "Perakende" },
];

const MISS_REASONS: Record<PriceImportUnmatched["reason"], string> = {
  unnamed: "Ürün adı hücresi boş",
  incomplete: "Fiyatlardan biri boş veya 0",
  not_found: "Bu kodla ürün bulunamadı",
  ambiguous: "Birden fazla ürüne uyuyor",
  conflict: "Aynı ad farklı fiyatlarla tekrar ediyor ya da aynı ürüne iki satır düşüyor",
  no_variants: "Ürünün satıştaki rengi yok",
};

const SKIP_REASONS: Record<PriceImportSkipped["reason"], string> = {
  foreign_currency: "Döviz cinsinden (yanında TL kolonu var)",
  vat_excluded: "KDV hariç fiyatlar",
  no_dealer_price: "BAYİ kolonu yok",
};

/** A change this large is worth a second look before it goes live. */
const LARGE_CHANGE = 25;

const where = (r: Pick<PriceImportRow, "row" | "side">) => `${r.side === "sol" ? "Sol" : "Sağ"} · ${r.row}. satır`;

function change(oldPrice: string, newPrice: string): number {
  return ((Number(newPrice) - Number(oldPrice)) / Number(oldPrice)) * 100;
}

function PriceCell({ row, group }: { row: PriceImportMatched; group: SegmentType }) {
  const next = row.prices[group];
  const old = row.old_prices[group];
  if (!next) return <td className="px-3 py-2.5 text-right text-slate-400">—</td>;
  const pct = old && old.currency === "TRY" ? change(old.price_incl_tax, next) : null;
  const tone =
    pct === null || Math.abs(pct) < 0.5
      ? "text-slate-500 dark:text-zinc-400"
      : Math.abs(pct) >= LARGE_CHANGE
        ? "font-semibold text-amber-600 dark:text-amber-400"
        : pct > 0
          ? "text-red-600 dark:text-red-400"
          : "text-emerald-600 dark:text-emerald-400";
  return (
    <td className="px-3 py-2.5 text-right tabular-nums">
      <span className="font-semibold">{formatMoney(next)}</span>
      <span className={`block text-[11px] ${tone}`}>
        {old
          ? `${formatMoney(old.price_incl_tax, old.currency)}${pct !== null && Math.abs(pct) >= 0.5 ? ` · ${pct > 0 ? "+" : ""}${pct.toFixed(0)}%` : ""}`
          : "yeni"}
      </span>
    </td>
  );
}

/**
 * Admin: "Toplu Fiyat (Excel)". The supplier's pricing workbook is dropped in,
 * read on the server without writing anything (a preview: every product it
 * found with its old and new prices, and every row it could not place), and
 * only on "Onayla ve Güncelle" sent again to be written — all four customer
 * groups, every colour of each product, in one transaction.
 */
export function AdminPriceImportView() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PriceImportResult | null>(null);
  const [busy, setBusy] = useState<"checking" | "applying" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function preview(chosen: File | undefined) {
    if (!chosen || busy) return;
    if (!chosen.name.toLowerCase().endsWith(".xlsx")) return setError("Yalnızca .xlsx biçimindeki Excel dosyaları yüklenebilir.");
    if (chosen.size > MAX_BYTES) return setError("Dosya en fazla 10 MB olabilir.");
    setFile(chosen);
    setResult(null);
    setError(null);
    setBusy("checking");
    try {
      setResult(await adminImportPrices(chosen, true));
    } catch (err) {
      setError(getApiErrorMessage(err, "Dosya okunamadı."));
    } finally {
      setBusy(null);
    }
  }

  async function apply() {
    if (!file || !result || busy) return;
    setBusy("applying");
    setError(null);
    try {
      const applied = await adminImportPrices(file, false);
      setResult(applied);
      setToast(`${applied.updated_products} ürünün fiyatı güncellendi (${applied.updated_variants} renk).`);
      void refreshStorefront();
    } catch (err) {
      setError(getApiErrorMessage(err, "Fiyatlar güncellenemedi; hiçbir fiyat değişmedi."));
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  const { over, handlers } = useFileDrop({ onFiles: (files) => void preview(files[0]), disabled: busy !== null });
  const applied = result !== null && !result.dry_run;

  return (
    <div>
      <AdminPageHeader
        title="Toplu Fiyat (Excel)"
        description="Fiyat Excel'ini yükleyin: önce hangi ürünlerin hangi fiyatlarla güncelleneceğini görün, sonra onaylayın. Bayi, toptan, kafe ve perakende fiyatları birlikte yazılır."
        actions={
          file && !busy ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Yeni dosya
            </button>
          ) : null
        }
      />

      <div
        {...handlers}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          over
            ? "border-red-400 bg-red-50/70 dark:border-red-400/60 dark:bg-red-500/10"
            : "border-slate-300 bg-white dark:border-white/15 dark:bg-zinc-900/40"
        }`}
      >
        {busy ? (
          <Loader2 className="h-9 w-9 animate-spin text-red-600" aria-hidden />
        ) : (
          <FileSpreadsheet className="h-9 w-9 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} aria-hidden />
        )}
        <div className="text-sm" aria-live="polite">
          <p className="font-medium">
            {busy === "checking"
              ? "Dosya okunuyor, ürünler eşleştiriliyor…"
              : busy === "applying"
                ? "Fiyatlar yazılıyor…"
                : over
                  ? "Bırakın, okuyalım"
                  : file
                    ? file.name
                    : "Fiyat Excel'ini buraya sürükleyin"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            veya{" "}
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy !== null}
              className="font-medium text-red-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:no-underline dark:text-red-400"
            >
              dosya seçin
            </button>
            . Yalnızca .xlsx · en fazla 10 MB. Ürün adı sütunu 0 ve 19, fiyatlar adın iki satır altında.
          </p>
        </div>
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void preview(e.target.files?.[0]);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
      </div>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {result && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label={applied ? "Güncellenen ürün" : "Eşleşen ürün"} value={result.matched.length} tone="emerald" />
            <Stat label="Eşleşmeyen satır" value={result.unmatched.length} tone={result.unmatched.length ? "amber" : "slate"} />
            <Stat label="Okunmayan blok (döviz / KDV hariç)" value={result.skipped.length} tone="slate" />
          </div>

          {applied && (
            <div className="mt-4">
              <Alert variant="success">
                {result.updated_products} ürünün {result.updated_variants} rengine dört müşteri grubunun fiyatı yazıldı.
              </Alert>
            </div>
          )}

          <section aria-labelledby="eslesen" className={`${panelClass} mt-6 overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
              <h2 id="eslesen" className="text-sm font-semibold">
                {applied ? "Güncellenen ürünler" : "Güncellenecek ürünler"}{" "}
                <span className="font-normal text-slate-500 dark:text-zinc-400">({result.matched.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                KDV dahil TL. Altta mevcut fiyat ve değişim; %{LARGE_CHANGE} üzeri değişimler sarı.
              </p>
            </div>
            {result.matched.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-zinc-400">Bu dosyada hiçbir ürün eşleşmedi.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-zinc-400">
                    <tr>
                      <th className="px-3 py-2.5">Excel</th>
                      <th className="px-3 py-2.5">Ürün</th>
                      {GROUPS.map((g) => (
                        <th key={g.key} className="px-3 py-2.5 text-right">
                          {g.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {result.matched.map((row) => (
                      <tr key={`${row.sheet}-${row.row}-${row.side}`}>
                        <td className="px-3 py-2.5 align-top">
                          <span className="font-mono text-xs font-semibold">{row.name}</span>
                          <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                            {where(row)}
                            {row.section ? ` · ${row.section}` : ""}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <span className="font-medium">{row.product_name}</span>
                          <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                            {row.product_code}
                            {row.matched_by === "sku" ? " · SKU ile" : row.matched_by === "name" ? " · ad ile" : ""}
                            {row.variants > 1 ? ` · ${row.variants} renk` : ""}
                          </span>
                        </td>
                        {GROUPS.map((g) => (
                          <PriceCell key={g.key} row={row} group={g.key} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {!applied && result.matched.length > 0 && (
            <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
              <p className="text-xs text-slate-500 dark:text-zinc-400 sm:mr-3">
                Eşleşmeyen ve okunmayan satırlara dokunulmaz.
              </p>
              <Button type="button" onClick={apply} loading={busy === "applying"} className="sm:w-auto sm:px-6">
                Onayla ve Güncelle ({result.matched.length} ürün)
              </Button>
            </div>
          )}

          {result.unmatched.length > 0 && (
            <section
              aria-labelledby="eslesmeyen"
              className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10"
            >
              <h2 id="eslesmeyen" className="flex items-center gap-2 border-b border-amber-200 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" aria-hidden /> Eşleşmeyen satırlar ({result.unmatched.length})
                <span className="font-normal text-amber-800/80 dark:text-amber-200/70">— Excel&apos;deki adı düzeltip dosyayı yeniden yükleyin</span>
              </h2>
              <ul className="divide-y divide-amber-200/70 dark:divide-amber-500/20">
                {result.unmatched.map((row) => (
                  <li key={`${row.sheet}-${row.row}-${row.side}`} className="flex flex-col gap-1 px-4 py-2.5 text-sm sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="w-44 shrink-0 font-mono text-xs font-semibold">{row.name || "(adsız)"}</span>
                    <span className="w-28 shrink-0 text-xs text-slate-500 dark:text-zinc-400">{where(row)}</span>
                    <span className="text-amber-900 dark:text-amber-200">{MISS_REASONS[row.reason]}</span>
                    {row.candidates.length > 0 && (
                      <span className="text-xs text-slate-600 dark:text-zinc-400">
                        {row.reason === "ambiguous" ? "Uyan ürünler" : "Benzer kodlar"}:{" "}
                        {row.candidates.map((c) => (
                          <span key={c.product_id} title={c.name} className="mr-1.5 inline-block rounded bg-white px-1.5 py-0.5 font-mono dark:bg-zinc-900">
                            {c.code}
                          </span>
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.skipped.length > 0 && (
            <details className={`${panelClass} mt-6`}>
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                Okunmayan bloklar ({result.skipped.length}){" "}
                <span className="font-normal text-slate-500 dark:text-zinc-400">
                  — yalnızca TL ve KDV dahil, BAYİ kolonlu bloklar okunur
                </span>
              </summary>
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto border-t border-slate-200 dark:divide-white/5 dark:border-white/10">
                {result.skipped.map((row) => (
                  <li key={`${row.sheet}-${row.row}-${row.side}`} className="flex gap-4 px-4 py-2 text-xs">
                    <span className="w-44 shrink-0 font-mono font-semibold">{row.name || "(adsız)"}</span>
                    <span className="w-28 shrink-0 text-slate-500 dark:text-zinc-400">{where(row)}</span>
                    <span className="text-slate-600 dark:text-zinc-300">{SKIP_REASONS[row.reason]}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-900/20"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "slate" }) {
  const color = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    slate: "text-slate-700 dark:text-zinc-200",
  }[tone];
  return (
    <div className={`${panelClass} px-4 py-3`}>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}
