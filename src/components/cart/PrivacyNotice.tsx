"use client";

import { ShieldCheck } from "lucide-react";

import { RichText } from "@/components/ui/RichText";
import type { LegalDocument } from "@/types";

/**
 * Gizlilik bilgilendirmesi: what happens to what the customer just typed.
 *
 * The text comes from the panel, so the shop can reword it without a deploy.
 * The box holds its height while it loads, which keeps the summary beneath it
 * from moving.
 */
export function PrivacyNotice({ document }: { document: LegalDocument | undefined | null }) {
  return (
    <section
      aria-labelledby="privacy-notice-heading"
      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6"
    >
      <h2
        id="privacy-notice-heading"
        className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-100"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        Gizlilik Bilgilendirmesi
      </h2>
      <div className="mt-2 min-h-[4.5rem]">
        {document ? (
          <RichText html={document.body} nested className="text-sm text-slate-700 dark:text-zinc-300" />
        ) : (
          <div className="space-y-2" aria-busy>
            <div className="h-3 w-full rounded bg-slate-200 motion-safe:animate-pulse dark:bg-white/10" />
            <div className="h-3 w-11/12 rounded bg-slate-200 motion-safe:animate-pulse dark:bg-white/10" />
            <div className="h-3 w-9/12 rounded bg-slate-200 motion-safe:animate-pulse dark:bg-white/10" />
          </div>
        )}
      </div>
    </section>
  );
}
