"use client";

import { useEffect, useRef } from "react";
import { CopyPlus, FileWarning, Rocket, Save, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatDateParts } from "@/lib/format";
import type { PricingRecord } from "@/lib/pricing";

const stampOf = (iso: string) => {
  const { date, time } = formatDateParts(iso);
  return `${date} ${time}`;
};

/** A price "Kaydet ve Siteye Uygula" is about to send: "Bayi Fiyatı", "₺1.380,00". */
export interface PriceLine {
  label: string;
  value: string;
}

/**
 * The calculator's one question, asked only when it has to be:
 *
 * - The code is already saved (`matches`, newest first): "Üstüne Yaz" writes
 *   over the newest, "Yeni Kayıt Olarak Ekle" adds one beside it.
 * - "Kaydet ve Siteye Uygula" (`apply`): the prices the product will get are
 *   listed first — with the question above, when there is one, in the same
 *   dialog, so applying is never two dialogs in a row.
 */
export function SaveDialog({
  code,
  matches,
  apply,
  busy,
  onOverwrite,
  onSaveNew,
  onConfirm,
  onClose,
}: {
  code: string;
  matches: PricingRecord[];
  /** "Kaydet ve Siteye Uygula": the green row's prices; null for "Kaydet". */
  apply: { prices: PriceLine[]; note: string } | null;
  busy: boolean;
  onOverwrite: (record: PricingRecord) => void;
  onSaveNew: () => void;
  /** No question to answer: save (over the loaded row, or as a new one) and apply. */
  onConfirm: () => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const newest = matches[0] as PricingRecord | undefined;
  const andApply = apply ? " ve Uygula" : "";

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={() => !busy && onClose()}>
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="save-dialog-title"
        aria-describedby="save-dialog-body"
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full ${apply && newest ? "max-w-2xl" : "max-w-xl"} rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="save-dialog-title" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            {newest ? (
              <>
                <FileWarning className="h-5 w-5 shrink-0 text-amber-500" aria-hidden /> Bu ürün koduyla bir kayıt zaten var
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 shrink-0 text-red-600" aria-hidden /> Siteye uygulansın mı?
              </>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Kapat"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div id="save-dialog-body" className="mt-3 space-y-3 text-sm text-slate-600 dark:text-zinc-300">
          {newest && (
            <div className="space-y-1.5">
              <p>
                <strong className="font-mono text-slate-900 dark:text-zinc-100">{newest.product_code || code}</strong> kodlu kayıt
                en son <strong className="text-slate-900 dark:text-zinc-100">{stampOf(newest.updated_at)}</strong> tarihinde
                kaydedildi{newest.file_name && <> (klasör: {newest.file_name})</>}. Üstüne mi yazılsın, yoksa yeni bir kayıt
                olarak mı eklensin?
              </p>
              {matches.length > 1 && (
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Bu koda ait {matches.length} kayıt var; en son kaydedilenin üstüne yazılır, diğerleri olduğu gibi kalır.
                </p>
              )}
            </div>
          )}
          {apply && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                Sitedeki fiyatlar bunlarla değişecek
              </p>
              <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
                {apply.prices.map((line) => (
                  <div key={line.label} className="contents">
                    <dt className="text-slate-700 dark:text-zinc-300">{line.label}</dt>
                    <dd className="text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-zinc-100">{line.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">{apply.note}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy} className="sm:w-auto">
            İptal
          </Button>
          {newest ? (
            <>
              <Button type="button" variant="secondary" onClick={onSaveNew} disabled={busy} className="sm:w-auto">
                <CopyPlus className="h-4 w-4" aria-hidden /> Yeni Kayıt Olarak Ekle{andApply}
              </Button>
              <Button type="button" data-autofocus loading={busy} onClick={() => onOverwrite(newest)} className="sm:w-auto">
                <Save className="h-4 w-4" aria-hidden /> Üstüne Yaz{andApply}
              </Button>
            </>
          ) : (
            <Button type="button" data-autofocus loading={busy} onClick={onConfirm} className="sm:w-auto">
              <Rocket className="h-4 w-4" aria-hidden /> Kaydet ve Uygula
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
