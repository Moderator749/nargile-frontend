"use client";

import { MessageSquareText } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { cartMessages } from "@/lib/i18n/messages/cart";

/** Long enough for a paragraph; the server refuses more. */
export const ORDER_NOTE_MAX = 500;

/**
 * Sipariş notu: whatever the customer wants the shop to know about this order.
 *
 * Nothing reads it but a person — it is printed on the order sheet in the panel
 * — so there is nothing to validate and nothing to get wrong. The counter only
 * appears once the note is long enough for the limit to matter, which keeps the
 * box quiet for the two-line note that most of them are.
 */
export function OrderNote({
  value,
  onChange,
  exportCopy = false,
}: {
  value: string;
  onChange: (value: string) => void;
  /**
   * An export account is addressed in English everywhere else (in Arabic on an
   * Arabic page), and is writing to the export team; so here.
   */
  exportCopy?: boolean;
}) {
  const t = useMessages(cartMessages);
  const left = ORDER_NOTE_MAX - value.length;
  const copy = exportCopy ? t.export.note : t.note;

  return (
    <section
      aria-labelledby="order-note-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6"
    >
      <h2 id="order-note-heading" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <MessageSquareText className="h-5 w-5 text-slate-400 dark:text-zinc-500" aria-hidden />
        {copy.heading}
        <span className="text-sm font-normal text-slate-500 dark:text-zinc-400">{copy.optional}</span>
      </h2>

      <div className="mt-4">
        <label htmlFor="order-note" className="sr-only">
          {copy.label}
        </label>
        <textarea
          id="order-note"
          rows={3}
          maxLength={ORDER_NOTE_MAX}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={copy.placeholder}
          aria-describedby="order-note-hint"
          className="block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {/* The hint's row is always there, so typing past the threshold does not
            push the page down. */}
        <div className="mt-1.5 flex min-h-[1.25rem] items-start justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
          <p id="order-note-hint">{copy.hint}</p>
          {value.length > ORDER_NOTE_MAX - 100 && (
            <p aria-live="polite" className="shrink-0 tabular-nums">
              {copy.counter(left)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
