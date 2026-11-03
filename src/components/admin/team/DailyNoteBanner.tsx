"use client";

import { useState } from "react";
import { Pin, Plus } from "lucide-react";

import { getApiErrorMessage } from "@/lib/errors";
import { NOTE_MAX, type DailyNote } from "@/lib/teamApi";
import { clockTime, dayLabel } from "@/lib/teamChannel";

const SMALL_BUTTON =
  "rounded-md px-2 py-1 text-xs font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500 disabled:opacity-50";

/**
 * "Günün Notu", pinned over the channel: one note for the whole team, set by
 * a super admin — who also sees how to add, change or clear it. Nothing at
 * all for the others while there is none.
 */
export function DailyNoteBanner({
  note,
  canEdit,
  onSave,
}: {
  note: DailyNote | null;
  canEdit: boolean;
  onSave: (text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = note?.text ?? null;

  async function save(value: string) {
    setBusy(true);
    setError(null);
    try {
      await onSave(value);
      setDraft(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Günün Notu kaydedilemedi."));
    } finally {
      setBusy(false);
    }
  }

  if (draft !== null) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
        <label htmlFor="gunun-notu" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
          <Pin className="h-3.5 w-3.5" aria-hidden /> Günün Notu
        </label>
        <textarea
          id="gunun-notu"
          value={draft}
          maxLength={NOTE_MAX}
          rows={3}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          className="mt-2 block w-full resize-none rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-amber-500/30 dark:bg-zinc-900"
        />
        <div className="mt-2 flex items-center gap-1">
          <button type="button" disabled={busy} onClick={() => save(draft)} className={`${SMALL_BUTTON} bg-amber-600 text-white hover:bg-amber-500`}>
            Kaydet
          </button>
          <button type="button" disabled={busy} onClick={() => setDraft(null)} className={`${SMALL_BUTTON} text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-500/20`}>
            Vazgeç
          </button>
          {text && (
            <button type="button" disabled={busy} onClick={() => save("")} className={`${SMALL_BUTTON} ms-auto text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10`}>
              Notu kaldır
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-1.5 text-xs text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (!text) {
    if (!canEdit) return null;
    return (
      <div className="border-b border-slate-200 px-4 py-2 dark:border-white/10">
        <button type="button" onClick={() => setDraft("")} className={`${SMALL_BUTTON} inline-flex items-center gap-1 text-amber-800 hover:bg-amber-50 dark:text-amber-200 dark:hover:bg-amber-500/10`}>
          <Plus className="h-3.5 w-3.5" aria-hidden /> Günün Notu ekle
        </button>
      </div>
    );
  }

  return (
    <section aria-label="Günün Notu" className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
          <Pin className="h-3.5 w-3.5" aria-hidden /> Günün Notu
        </p>
        {canEdit && (
          <button type="button" onClick={() => setDraft(text)} className={`${SMALL_BUTTON} text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-500/20`}>
            Düzenle
          </button>
        )}
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-amber-950 dark:text-amber-50">{text}</p>
      {note?.updated_at && (
        <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-200/70">
          {note.updated_by_name} · {dayLabel(note.updated_at)} {clockTime(note.updated_at)}
        </p>
      )}
    </section>
  );
}
