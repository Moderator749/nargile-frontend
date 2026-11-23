"use client";

import type { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";


/**
 * One delivery choice: what it is, with a radio mark that shows the chosen one.
 *
 * The whole card is the radio's label, so a tap anywhere on it picks it; the
 * mark at its end only shows which is picked. (It used to be an "Onay" button
 * beside the label, which read as a second step to confirm — 2026-11-23.)
 *
 * A confirmed card stands out and the rest fade back, so the open one is
 * obvious at a glance.
 *
 * A card can also be present without being available — the İstanbul van below
 * its limit. It then says what it is waiting for instead of vanishing, so the
 * customer can see what the option would take.
 */
export function DeliveryCard({
  name,
  selected,
  onSelect,
  title,
  summary,
  Icon,
  disabled = false,
  notice,
  children,
}: {
  /** The radio group this card belongs to. */
  name: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  /** The line under the title; a saved address's own, or what the option does. */
  summary: string;
  Icon: LucideIcon;
  /** Shown, but not choosable yet; `notice` says what it is waiting for. */
  disabled?: boolean;
  /** A line below the summary, shown whether or not this is the chosen card. */
  notice?: ReactNode;
  /** What this option asks for, revealed once it is the chosen one. */
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-3 transition-[color,background-color,border-color,box-shadow,opacity] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
        selected
          ? "border-red-600 bg-white shadow-md ring-1 ring-red-600 dark:border-red-400 dark:bg-zinc-900 dark:ring-red-400"
          : disabled
            ? "border-dashed border-slate-200 bg-slate-50 opacity-60 dark:border-white/10 dark:bg-white/[0.02]"
            : "border-slate-200 bg-slate-50 opacity-60 hover:border-slate-400 hover:opacity-100 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/25"
      }`}
    >
      <div className="flex items-start gap-3">
        <label
          className={`flex min-w-0 flex-1 items-start gap-3 text-sm ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <input
            type="radio"
            name={name}
            checked={selected}
            onChange={onSelect}
            disabled={disabled}
            className="sr-only"
          />
          <Icon
            className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-zinc-500"}`}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block font-semibold text-slate-900 dark:text-zinc-100">{title}</span>
            {/* Clamped, so a long address cannot make one card twice the height
                of the next; the whole line is in the tooltip. */}
            <span className="line-clamp-2 text-xs text-slate-500 dark:text-zinc-400" title={summary}>
              {summary}
            </span>
            {notice && (
              <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-400">
                {notice}
              </span>
            )}
          </span>
          <span
            aria-hidden
            className={`ms-auto mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
              selected
                ? "border-red-600 bg-red-600 text-white dark:border-red-400 dark:bg-red-400 dark:text-zinc-950"
                : "border-slate-300 dark:border-white/20"
            }`}
          >
            {selected && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        </label>
      </div>
      {selected && children && (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10">{children}</div>
      )}
    </div>
  );
}
