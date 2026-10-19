"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Link2, Loader2, RotateCcw, Search, ShieldCheck, Sparkles, Unlink } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { AliasDictionary } from "@/components/admin/price-import/AliasDictionary";
import { BatchAcceptDialog, safePicks } from "@/components/admin/price-import/BatchAcceptDialog";
import { CatalogSearch } from "@/components/admin/price-import/CatalogSearch";
import { ProductThumb } from "@/components/admin/price-import/ProductThumb";
import { GROUPS, rowKey, where } from "@/components/admin/price-import/shared";
import { RowSummary, SuggestionRow } from "@/components/admin/price-import/SuggestionRow";
import { useFileDrop } from "@/components/admin/useFileDrop";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  adminDeleteImportAlias,
  adminImportPrices,
  adminListImportAliases,
  adminSaveImportAlias,
  adminSaveImportAliases,
} from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { refreshStorefront } from "@/lib/revalidate";
import type { PriceImportAlias, PriceImportMatched, PriceImportResult, PriceImportSkipped, PriceImportUnmatched, SegmentType } from "@/types";

const MAX_BYTES = 10 * 1024 * 1024;

const MISS_REASONS: Record<PriceImportUnmatched["reason"], string> = {
  unnamed: "Ürün adı hücresi boş",
  incomplete: "Fiyatlardan biri boş veya 0",
  not_found: "Bu modelde ürün yok",
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
 * Admin: "Excel Dosya Aktarımı". The supplier's pricing workbook is dropped in,
 * read on the server without writing anything (a preview: every product it
 * found with its old and new prices, every row it could only guess at, and
 * every row it could not place), and only on "Onayla ve Güncelle" sent again
 * to be written — all four customer groups, every colour of each product, in
 * one transaction.
 *
 * A guess is never priced. The admin ties a name to its product — one
 * suggestion at a time, every safe suggestion at once, or a product found in
 * the catalog by hand — and the eşleştirme is kept (the dictionary at the
 * foot of the page), matched by itself on every later upload. Each change
 * reads the same file again, so the server always says where every row stands.
 */
export function AdminPriceImportView() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PriceImportResult | null>(null);
  const [busy, setBusy] = useState<"checking" | "applying" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // What an eşleştirme change is in flight for: a row, "batch", or an alias id.
  const [pending, setPending] = useState<string | null>(null);
  const [aliases, setAliases] = useState<PriceImportAlias[]>([]);
  const [aliasesLoading, setAliasesLoading] = useState(true);
  const [batchOpen, setBatchOpen] = useState(false);
  const [searchingRow, setSearchingRow] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // The dictionary, once on arrival and again after every eşleştirme change.
  const loadAliases = useCallback(
    (signal?: AbortSignal) =>
      adminListImportAliases(signal)
        .then(setAliases)
        .catch(() => {
          // Aborted, or unreachable: the dictionary keeps what it showed.
        })
        .finally(() => setAliasesLoading(false)),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadAliases(controller.signal);
    return () => controller.abort();
  }, [loadAliases]);

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

  /** An eşleştirme saved or removed: the dictionary and the file read again. */
  async function rematch(work: () => Promise<unknown>, done: string, key: string) {
    if (pending || busy) return;
    setPending(key);
    setError(null);
    try {
      await work();
      const [next] = await Promise.all([file ? adminImportPrices(file, true) : Promise.resolve(null), loadAliases()]);
      if (next) setResult(next);
      setToast(done);
    } catch (err) {
      setError(getApiErrorMessage(err, "Eşleştirme kaydedilemedi."));
    } finally {
      setPending(null);
    }
  }

  const bind = (name: string, key: string, productId: string, code: string) =>
    rematch(() => adminSaveImportAlias(name, productId), `“${name}” artık ${code} ile eşleşiyor; sonraki yüklemelerde de hatırlanacak.`, key);

  const picks = result ? safePicks(result.suggested) : [];
  async function acceptSafe() {
    await rematch(
      () => adminSaveImportAliases(picks.map(({ row, candidate }) => ({ excelName: row.name, productId: candidate.product_id }))),
      `${picks.length} güvenli öneri eşleştirildi.`,
      "batch",
    );
    setBatchOpen(false);
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
  const locked = pending !== null || busy !== null;

  return (
    <div>
      <AdminPageHeader
        title="Excel Dosya Aktarımı"
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
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={applied ? "Güncellenen ürün" : "Eşleşen ürün"} value={result.matched.length} tone="emerald" />
            <Stat label="Önerilen eşleşme (onay bekliyor)" value={result.suggested.length} tone={result.suggested.length ? "sky" : "slate"} />
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
                <table className="w-full min-w-[820px] text-sm">
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
                      <tr key={rowKey(row)}>
                        <td className="px-3 py-2.5 align-top">
                          <span className="font-mono text-xs font-semibold">{row.name}</span>
                          <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                            {where(row)}
                            {row.section ? ` · ${row.section}` : ""}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <span className="flex items-start gap-2.5">
                            <ProductThumb src={row.image_url} />
                            <span className="min-w-0">
                              <span className="block font-medium">{row.product_name}</span>
                              <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                                {row.product_code}
                                {row.matched_by === "sku" ? " · SKU ile" : row.matched_by === "name" ? " · ad ile" : ""}
                                {row.variants > 1 ? ` · ${row.variants} renk` : ""}
                              </span>
                              {row.matched_by === "alias" && row.alias_id !== null && (
                                <span className="mt-1 inline-flex items-center gap-1.5 text-[11px]">
                                  <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                                    <Link2 className="h-3 w-3" aria-hidden /> kayıtlı eşleştirme
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void rematch(() => adminDeleteImportAlias(row.alias_id!), `“${row.name}” eşleştirmesi kaldırıldı.`, rowKey(row))
                                    }
                                    disabled={locked}
                                    aria-label={`“${row.name}” eşleştirmesini kaldır`}
                                    className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-white/5"
                                  >
                                    {pending === rowKey(row) ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Unlink className="h-3 w-3" aria-hidden />}
                                    kaldır
                                  </button>
                                </span>
                              )}
                            </span>
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
              <p className="text-xs text-slate-500 dark:text-zinc-400 sm:mr-3">Önerilen, eşleşmeyen ve okunmayan satırlara dokunulmaz.</p>
              <Button type="button" onClick={apply} loading={busy === "applying"} disabled={pending !== null} className="sm:w-auto sm:px-6">
                Onayla ve Güncelle ({result.matched.length} ürün)
              </Button>
            </div>
          )}

          {result.suggested.length > 0 && (
            <section
              aria-labelledby="onerilen"
              className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/50 dark:border-sky-500/30 dark:bg-sky-500/10"
            >
              <div className="flex flex-col gap-3 border-b border-sky-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-sky-500/30">
                <div>
                  <h2 id="onerilen" className="flex items-center gap-2 text-sm font-semibold text-sky-900 dark:text-sky-200">
                    <Sparkles className="h-4 w-4" aria-hidden /> Önerilen eşleşmeler ({result.suggested.length})
                  </h2>
                  <p className="mt-0.5 text-xs text-sky-800/80 dark:text-sky-200/70">
                    Doğru ürünü tıklayın ya da katalogda arayın: eşleştirme kaydedilir, satır güncellenecekler listesine geçer ve sonraki
                    yüklemelerde sorulmaz. Onaylanmayan satırın fiyatı değişmez.
                  </p>
                </div>
                {picks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBatchOpen(true)}
                    disabled={locked}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden /> Tüm güvenli önerileri eşleştir ({picks.length})
                  </button>
                )}
              </div>
              <ul className="divide-y divide-sky-200/70 dark:divide-sky-500/20">
                {result.suggested.map((row) => (
                  <SuggestionRow
                    key={rowKey(row)}
                    row={row}
                    saving={pending === rowKey(row)}
                    disabled={locked}
                    onBind={(productId, code) => void bind(row.name, rowKey(row), productId, code)}
                  />
                ))}
              </ul>
            </section>
          )}

          {result.unmatched.length > 0 && (
            <section
              aria-labelledby="eslesmeyen"
              className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10"
            >
              <h2 id="eslesmeyen" className="flex flex-wrap items-center gap-2 border-b border-amber-200 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" aria-hidden /> Eşleşmeyen satırlar ({result.unmatched.length})
                <span className="font-normal text-amber-800/80 dark:text-amber-200/70">
                  — fiyatlarına dokunulmaz; bulunamayanları katalogda arayıp eşleştirebilirsiniz
                </span>
              </h2>
              <ul className="divide-y divide-amber-200/70 dark:divide-amber-500/20">
                {result.unmatched.map((row) => {
                  const key = rowKey(row);
                  const searchable = row.reason === "not_found";
                  return (
                    <li key={key} className="flex flex-col gap-2 px-4 py-2.5 text-sm lg:flex-row lg:items-start lg:gap-6">
                      <RowSummary row={row} />
                      <div className="min-w-0 flex-1">
                        <p className="text-amber-900 dark:text-amber-200">{MISS_REASONS[row.reason]}</p>
                        {searchable &&
                          (searchingRow === key ? (
                            <div className="mt-2">
                              <CatalogSearch
                                label={`“${row.name}” için ürün ara`}
                                disabled={locked}
                                onPick={(product) => {
                                  setSearchingRow(null);
                                  void bind(row.name, key, product.id, product.base_code);
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSearchingRow(key)}
                              disabled={locked}
                              className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-amber-900 hover:bg-white disabled:opacity-50 dark:text-amber-200 dark:hover:bg-white/5"
                            >
                              {pending === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Search className="h-3.5 w-3.5" aria-hidden />}
                              Katalogda ara ve eşleştir
                            </button>
                          ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.skipped.length > 0 && (
            <details className={`${panelClass} mt-6`}>
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                Okunmayan bloklar ({result.skipped.length}){" "}
                <span className="font-normal text-slate-500 dark:text-zinc-400">— yalnızca TL ve KDV dahil, BAYİ kolonlu bloklar okunur</span>
              </summary>
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto border-t border-slate-200 dark:divide-white/5 dark:border-white/10">
                {result.skipped.map((row) => (
                  <li key={rowKey(row)} className="flex gap-4 px-4 py-2 text-xs">
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

      <AliasDictionary
        aliases={aliases}
        loading={aliasesLoading}
        removing={pending?.startsWith("alias-") ? Number(pending.slice(6)) : null}
        onRemove={(alias) =>
          void rematch(() => adminDeleteImportAlias(alias.id), `“${alias.excel_name}” eşleştirmesi silindi.`, `alias-${alias.id}`)
        }
      />

      <BatchAcceptDialog
        open={batchOpen}
        picks={picks}
        saving={pending === "batch"}
        onClose={() => setBatchOpen(false)}
        onConfirm={() => void acceptSafe()}
      />

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

function Stat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "sky" | "amber" | "slate" }) {
  const color = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    sky: "text-sky-600 dark:text-sky-400",
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
