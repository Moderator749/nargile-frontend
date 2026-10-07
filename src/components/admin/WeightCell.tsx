"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { adminUpdateVariantWeight } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { parseDecimalInput } from "@/lib/format";
import type { AdminVariant } from "@/types";

/** Shows "1,25" for "1.250": Turkish decimal comma, no trailing zeros. */
const display = (kg: string | null) =>
  kg === null ? "" : Number(kg).toLocaleString("tr-TR", { maximumFractionDigits: 3 });

/**
 * Inline unit-weight editor (kg). Saves on Enter or blur; empty clears it.
 * Coal needs weights: the cart's 20 kg free-shipping rule counts unknown as 0 kg.
 */
export function WeightCell({
  variant,
  isCoal,
  onSaved,
}: {
  variant: AdminVariant;
  isCoal: boolean;
  onSaved: (weightKg: string | null) => void;
}) {
  const [value, setValue] = useState(display(variant.weight_kg));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const raw = value.trim();
    // Reuses the money parser: accepts "1,25" or "1.25", rejects junk.
    const parsed = raw === "" ? null : parseDecimalInput(raw);
    if (raw !== "" && (parsed === null || Number(parsed) <= 0)) {
      setState("error");
      setError("Geçerli bir ağırlık girin (ör. 1 veya 0,8).");
      return;
    }
    const next = parsed === null ? null : Number(parsed).toString();
    if ((variant.weight_kg === null ? null : Number(variant.weight_kg).toString()) === next) return;

    setState("saving");
    setError(null);
    try {
      const saved = await adminUpdateVariantWeight(variant.id, next);
      onSaved(saved.weight_kg);
      setValue(display(saved.weight_kg));
      setState("saved");
    } catch (err) {
      setState("error");
      setError(getApiErrorMessage(err, "Ağırlık kaydedilemedi."));
    }
  }

  const missing = isCoal && variant.weight_kg === null;
  return (
    <div className="flex items-center justify-end gap-1.5">
      <label htmlFor={`weight-${variant.id}`} className="sr-only">
        {variant.sku} birim ağırlığı (kg)
      </label>
      <input
        id={`weight-${variant.id}`}
        inputMode="decimal"
        value={value}
        placeholder={missing ? "kg?" : "—"}
        onChange={(e) => {
          setValue(e.target.value);
          setState("idle");
        }}
        onBlur={() => void save()}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        aria-invalid={state === "error"}
        title={error ?? (missing ? "Kömürün ağırlığı yok: 20 kg ücretsiz kargo kuralında 0 kg sayılır." : "Birim ağırlık (kg)")}
        className={`h-8 w-20 rounded-lg border px-2 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:bg-zinc-900 ${
          state === "error"
            ? "border-red-400"
            : missing
              ? "border-amber-300 bg-amber-50 placeholder:text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/10"
              : "border-slate-200 dark:border-white/10"
        }`}
      />
      <span className="flex w-4 justify-center" aria-live="polite">
        {state === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" aria-label="Kaydediliyor" />}
        {state === "saved" && <Check className="h-3.5 w-3.5 text-emerald-600" aria-label="Kaydedildi" />}
      </span>
    </div>
  );
}
