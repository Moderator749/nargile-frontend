"use client";

import { sheetInputClass } from "@/components/admin/products/SheetParts";

/**
 * "Adet Şartı": free carriage only from this many units. It sits under the
 * Ücretsiz Kargo toggle it qualifies and is titled like the rules around it, so
 * it does not read as that toggle's sub-text.
 */
export function QuantityCondition({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_7rem] items-start gap-3 border-b border-dashed border-slate-200 py-2.5 last:border-b-0 dark:border-white/10">
      <label htmlFor={id} className="min-w-0">
        <span className="block text-sm font-medium">Adet Şartı</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-zinc-400">
          Ücretsiz kargo bu adetten itibaren geçerli; boş bırakılırsa şart yok.
        </span>
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits ? Number(digits) : null);
        }}
        placeholder="—"
        className={`${sheetInputClass} text-right tabular-nums`}
      />
    </div>
  );
}
