"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onChange: (quantity: number) => void;
  label: string;
}

const stepClass =
  "flex h-9 w-9 items-center justify-center text-slate-600 dark:text-zinc-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40";

/** +/- buttons plus a typeable field, so B2B buyers can enter "50" directly. */
export function QuantityStepper({ value, onChange, label }: QuantityStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const n = Number.parseInt(draft, 10);
    if (Number.isFinite(n) && n >= 1) onChange(n);
    setDraft(null);
  }

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-zinc-900">
      <button
        type="button"
        className={stepClass}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={`${label}: adedi azalt`}
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={`${label}: adet`}
        className="h-9 w-12 bg-transparent border-x border-slate-300 dark:border-white/15 text-center text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500/40"
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(null);
        }}
      />
      <button
        type="button"
        className={stepClass}
        onClick={() => onChange(value + 1)}
        aria-label={`${label}: adedi artır`}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
