"use client";

import { MessagesSquare } from "lucide-react";

import { useTeamChannel } from "@/store/useTeamChannel";

/**
 * What a staff account sees on any panel page: the rest of the panel is the
 * admins' (its API refuses staff), so the one thing here is the way into
 * Ekip Kanalı.
 */
export function StaffHome() {
  const setOpen = useTeamChannel((s) => s.setOpen);
  // AdminShell's panel card, written out: AdminShell renders this component.
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-none">
      <MessagesSquare className="mx-auto h-10 w-10 text-red-600 dark:text-red-500" strokeWidth={1.5} aria-hidden />
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Ekip Kanalı</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
        Siparişler, kargo ve günün işleri için ekibin ortak kanalı. Panelin diğer sayfaları yönetici hesaplarına açıktır.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-red-600 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        <MessagesSquare className="h-4 w-4" aria-hidden /> Kanalı aç
      </button>
    </section>
  );
}
