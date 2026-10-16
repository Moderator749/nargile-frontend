"use client";

import { useEffect, useRef, useState } from "react";
import { FolderPlus, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatDateParts } from "@/lib/format";
import type { FileTarget, PricingFile } from "@/lib/pricing";

const stampOf = (iso: string) => {
  const { date, time } = formatDateParts(iso);
  return `${date} ${time}`;
};

const field =
  "block h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100";

/**
 * "Dosyaya kaydet": pick a file the row goes into, or name a new one. Used by
 * both file buttons; the apply one says what else will happen.
 */
export function FileDialog({
  files,
  title,
  note,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  files: PricingFile[];
  title: string;
  note?: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: (target: FileTarget) => void;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState<string>(files[0] ? String(files[0].id) : "new");
  const [name, setName] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("select, input")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const target: FileTarget | null =
    choice === "new" ? (name.trim() ? { file_name: name.trim() } : null) : { file_id: Number(choice) };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="file-dialog-title" className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {note && <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{note}</p>}

        <label htmlFor="file-choice" className="mt-5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
          Dosya
        </label>
        <select id="file-choice" value={choice} onChange={(e) => setChoice(e.target.value)} className={`${field} mt-1.5`}>
          {files.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} · {f.record_count} kayıt · son kayıt {stampOf(f.updated_at)}
            </option>
          ))}
          <option value="new">+ Yeni dosya oluştur</option>
        </select>
        {choice === "new" && (
          <div className="mt-3">
            <label htmlFor="file-name" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Yeni dosya adı
            </label>
            <input
              id="file-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="örn. Ekim 2026 Zam Listesi"
              className={`${field} mt-1.5`}
            />
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} className="sm:w-auto">
            Vazgeç
          </Button>
          <Button type="button" disabled={!target} loading={busy} onClick={() => target && onConfirm(target)} className="sm:w-auto">
            <FolderPlus className="h-4 w-4" aria-hidden /> {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
