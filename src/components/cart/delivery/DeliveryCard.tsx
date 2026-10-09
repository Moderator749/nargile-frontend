"use client";

import type { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";

/**
 * One delivery choice: what it is, and an "Onay" button that confirms it.
 *
 * The card carries the choice twice on purpose — the whole card is the radio's
 * label, and the button is the explicit confirmation the blueprint asks for.
 * Both do the same thing, so either reads as "this one". The button is a real
 * button rather than something inside the label, which keeps the markup valid
 * and both controls reachable from the keyboard.
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
        </label>
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          aria-pressed={selected}
          className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors duration-200 ${
            selected
              ? "bg-emerald-600 text-white"
              : disabled
                ? "cursor-not-allowed border border-slate-200 text-slate-400 dark:border-white/10 dark:text-zinc-500"
                : "border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-white/15 dark:text-zinc-300 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
          }`}
        >
          {selected ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden /> Onaylandı
            </>
          ) : (
            "Onay"
          )}
        </button>
      </div>
      {selected && children && (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10">{children}</div>
      )}
    </div>
  );
}
