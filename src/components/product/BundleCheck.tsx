"use client";

import { Check } from "lucide-react";

/** "Pakete dahil": a 44px-high row under the card, the box ticked in the shop's red. */
export function BundleCheck({
  checked,
  onToggle,
  label,
  ariaLabel,
  disabled = false,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`group/check inline-flex min-h-11 select-none items-center gap-2 text-sm font-medium ${
        disabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer text-foreground"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        aria-label={ariaLabel}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-300 bg-white text-white transition-colors peer-checked:border-red-600 peer-checked:bg-red-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-600 dark:border-white/25 dark:bg-zinc-900 dark:peer-checked:border-red-500 dark:peer-checked:bg-red-500"
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
}
