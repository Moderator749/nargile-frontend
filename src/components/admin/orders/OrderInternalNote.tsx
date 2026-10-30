"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";

import { SheetBlock } from "@/components/admin/orders/SheetBlock";
import type { AdminOrder } from "@/types";

const NOTE_MAX = 5000;

/**
 * "Gizli Mağaza Notu": the shop's own note on the order — a phone call, a
 * promise, a warning for whoever packs it. Only the panel reads it: the server
 * never sends it to the customer, and the printed sheet leaves it off too.
 *
 * What was last saved is kept here rather than read back from the order: the
 * sheet's copy of the order may be a moment older than the save.
 */
export function OrderInternalNote({
  order,
  onSave,
}: {
  order: AdminOrder;
  onSave: (note: string) => Promise<AdminOrder>;
}) {
  const [saved, setSaved] = useState(order.internal_note ?? "");
  const [draft, setDraft] = useState(saved);
  const [state, setState] = useState<{ kind: "idle" | "saving" | "saved" } | { kind: "error"; text: string }>({ kind: "idle" });
  const dirty = draft.trim() !== saved.trim();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState({ kind: "saving" });
    try {
      const updated = await onSave(draft);
      const note = updated.internal_note ?? "";
      setSaved(note);
      setDraft(note);
      setState({ kind: "saved" });
    } catch (err) {
      setState({ kind: "error", text: err instanceof Error ? err.message : "Not kaydedilemedi." });
    }
  }

  return (
    <SheetBlock title="Gizli Mağaza Notu" print={false} className="border-amber-300 dark:border-amber-500/30">
      <form onSubmit={submit} className="space-y-2 bg-amber-50/60 p-3 dark:bg-amber-500/[0.04]">
        <p className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
          <Lock className="h-3 w-3" aria-hidden /> Yalnızca yöneticiler görür; müşteriye hiçbir yerde gösterilmez.
        </p>
        <label htmlFor={`internal-note-${order.id}`} className="sr-only">
          Gizli mağaza notu
        </label>
        <textarea
          id={`internal-note-${order.id}`}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (state.kind !== "saving") setState({ kind: "idle" });
          }}
          maxLength={NOTE_MAX}
          rows={3}
          placeholder="Örn. Müşteri aradı, cuma teslim istiyor."
          className="block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <div className="flex items-center justify-end gap-3">
          <p role="status" className="text-xs">
            {state.kind === "saved" && <span className="text-emerald-700 dark:text-emerald-400">Kaydedildi</span>}
            {state.kind === "error" && <span className="text-red-600 dark:text-red-400">{state.text}</span>}
          </p>
          <button
            type="submit"
            disabled={!dirty || state.kind === "saving"}
            aria-busy={state.kind === "saving"}
            className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-bold uppercase tracking-wider text-white transition-colors duration-200 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {state.kind === "saving" ? "Kaydediliyor…" : "Notu Kaydet"}
          </button>
        </div>
      </form>
    </SheetBlock>
  );
}
