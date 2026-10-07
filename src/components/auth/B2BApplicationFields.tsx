"use client";

import { Input } from "@/components/ui/Input";
import type { B2BApplicationInput, B2BSegment } from "@/types";

export const B2B_SEGMENT_LABELS: Record<B2BSegment, string> = {
  CAFE: "Kafe / Restoran",
  WHOLESALE: "Toptancı",
  DEALER: "Bayi",
};

export const EMPTY_APPLICATION: B2BApplicationInput = { segment: "CAFE", company_title: "", tax_number: "", tax_office: "" };

/** Mirrors the server's checks; null = valid. */
export function applicationProblem(a: B2BApplicationInput): string | null {
  if (a.company_title.trim().length < 2) return "Firma unvanını girin.";
  if (!/^\d{10,11}$/.test(a.tax_number.replace(/\s+/g, ""))) return "Vergi numarası 10 (VKN) veya 11 (TCKN) haneli olmalı.";
  return null;
}

/** Kafe / Toptan / Bayi application fields (sign-up and the account page). */
export function B2BApplicationFields({
  value,
  onChange,
}: {
  value: B2BApplicationInput;
  onChange: (value: B2BApplicationInput) => void;
}) {
  const set = (patch: Partial<B2BApplicationInput>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">İşletme türü</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(B2B_SEGMENT_LABELS) as B2BSegment[]).map((segment) => (
            <label
              key={segment}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
                value.segment === segment
                  ? "border-red-600 bg-red-50/60 font-semibold ring-1 ring-red-600 dark:border-red-400 dark:bg-red-500/10 dark:ring-red-400"
                  : "border-slate-300 hover:border-slate-400 dark:border-white/15"
              }`}
            >
              <input
                type="radio"
                name="b2b_segment"
                value={segment}
                checked={value.segment === segment}
                onChange={() => set({ segment })}
                className="sr-only"
              />
              {B2B_SEGMENT_LABELS[segment]}
            </label>
          ))}
        </div>
      </fieldset>
      <Input label="Firma unvanı" value={value.company_title} maxLength={255} onChange={(e) => set({ company_title: e.target.value })} autoComplete="organization" />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vergi no / TCKN"
          inputMode="numeric"
          value={value.tax_number}
          maxLength={11}
          onChange={(e) => set({ tax_number: e.target.value.replace(/\D/g, "") })}
        />
        <Input label="Vergi dairesi" value={value.tax_office ?? ""} maxLength={100} onChange={(e) => set({ tax_office: e.target.value })} />
      </div>
    </div>
  );
}
