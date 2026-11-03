"use client";

import { useEffect, useRef } from "react";
import { CopyPlus, FileWarning, Save, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatDateParts } from "@/lib/format";
import type { PricingRecord } from "@/lib/pricing";

const stampOf = (iso: string) => {
  const { date, time } = formatDateParts(iso);
  return `${date} ${time}`;
};

/**
 * "Mevcut Dosya Bulundu": a save whose product code its destination (a file,
 * or the drafts) already holds. "Üzerine Yaz" writes over the newest of them;
 * "Yeni Olarak Kaydet" adds a row beside it, as every save did before.
 */
export function DuplicateDialog({
  code,
  matches,
  busy,
  onOverwrite,
  onSaveNew,
  onClose,
}: {
  code: string;
  /** The rows holding the code there, newest first (never empty). */
  matches: PricingRecord[];
  busy: boolean;
  onOverwrite: (record: PricingRecord) => void;
  onSaveNew: () => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const newest = matches[0];

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="duplicate-title"
        aria-describedby="duplicate-body"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="duplicate-title" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <FileWarning className="h-5 w-5 text-amber-500" aria-hidden /> Mevcut Dosya Bulundu
          </h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div id="duplicate-body" className="mt-3 space-y-2 text-sm text-slate-600 dark:text-zinc-300">
          <p>
            <strong className="font-mono text-slate-900 dark:text-zinc-100">{code}</strong> kodlu bir hesaplama zaten{" "}
            {newest.file_name ? (
              <>
                Dosyalar’da (<strong className="text-slate-900 dark:text-zinc-100">{newest.file_name}</strong>)
              </>
            ) : (
              "Taslaklar’da"
            )}{" "}
            mevcut. Mevcut dosyanın üzerine mi yazmak istiyorsunuz?
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {matches.length > 1
              ? `Burada bu koda ait ${matches.length} kayıt var; en son kaydedilenin (${stampOf(newest.updated_at)}) üzerine yazılır, diğerleri olduğu gibi kalır.`
              : `Mevcut kayıt: ${newest.product_name || "Adsız ürün"} · son kayıt ${stampOf(newest.updated_at)}.`}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy} className="sm:w-auto">
            İptal
          </Button>
          <Button type="button" variant="secondary" onClick={onSaveNew} disabled={busy} className="sm:w-auto">
            <CopyPlus className="h-4 w-4" aria-hidden /> Yeni Olarak Kaydet
          </Button>
          <Button type="button" data-autofocus loading={busy} onClick={() => onOverwrite(newest)} className="sm:w-auto">
            <Save className="h-4 w-4" aria-hidden /> Üzerine Yaz
          </Button>
        </div>
      </div>
    </div>
  );
}
