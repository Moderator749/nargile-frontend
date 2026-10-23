"use client";

import { useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { cartMessages } from "@/lib/i18n/messages/cart";

interface QuantityStepperProps {
  value: number;
  onChange: (quantity: number) => void;
  label: string;
  /** The most that may be ordered, where it is known (a firm's quota, or a limit already met); none otherwise. */
  max?: number | null;
  /** The quantity was just taken down to the most there is: say so (never the number). */
  limitReached?: boolean;
}

const stepClass =
  "flex h-11 w-11 items-center justify-center sm:h-9 sm:w-9 text-slate-600 dark:text-zinc-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * +/- buttons around a field the buyer can type into, so a B2B order of "150"
 * is typed, not clicked. Whole numbers from 1 only: anything else is dropped as
 * it is typed. A number counts as soon as it is typed (so "Sepete Ekle" right
 * after takes it); one above `max` is held to `max`, with a warning saying why
 * ("Stok sınırına ulaştınız", never how many there are), and the field shows
 * the corrected number once the buyer leaves it. Where the limit is not known,
 * the page holds the quantity to the stock itself and passes `limitReached`. A cleared
 * field goes back to what it was; Escape undoes the typing.
 */
export function QuantityStepper({ value, onChange, label, max, limitReached = false }: QuantityStepperProps) {
  const t = useMessages(cartMessages).stepper;
  const [draft, setDraft] = useState<string | null>(null);
  const before = useRef(value);
  const limit = max != null && max > 0 ? max : null;
  const typed = draft ? Number.parseInt(draft, 10) : value;
  const over = limit !== null && typed > limit;

  function type(text: string) {
    const digits = text.replace(/\D/g, "").replace(/^0+/, "").slice(0, 6);
    setDraft(digits);
    const n = Number.parseInt(digits, 10);
    if (n >= 1) onChange(limit !== null ? Math.min(n, limit) : n);
  }

  return (
    <div className="relative inline-flex">
      <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-zinc-900">
        <button
          type="button"
          className={stepClass}
          onClick={() => onChange(limit !== null ? Math.min(value - 1, limit) : value - 1)}
          disabled={value <= 1}
          aria-label={t.decrease(label)}
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-label={t.quantity(label)}
          aria-invalid={over || undefined}
          className={`h-11 w-14 bg-transparent sm:h-9 sm:w-16 border-x border-slate-300 dark:border-white/15 text-center text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-inset ${
            over ? "text-red-600 focus:ring-red-500/60 dark:text-red-400" : "focus:ring-red-500/40"
          }`}
          value={draft ?? String(value)}
          onFocus={(e) => {
            before.current = value;
            e.currentTarget.select();
          }}
          onChange={(e) => type(e.target.value)}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              onChange(before.current);
              setDraft(null);
            }
          }}
        />
        <button
          type="button"
          className={stepClass}
          onClick={() => onChange(value + 1)}
          disabled={limit !== null && value >= limit}
          aria-label={t.increase(label)}
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {/* Under the field, without moving anything around it. */}
      <p
        aria-live="polite"
        className="pointer-events-none absolute start-0 top-full mt-1 w-60 max-w-[calc(100vw-4rem)] text-xs font-medium leading-snug text-red-600 dark:text-red-400"
      >
        {over || limitReached ? t.stockLimit : ""}
      </p>
    </div>
  );
}
