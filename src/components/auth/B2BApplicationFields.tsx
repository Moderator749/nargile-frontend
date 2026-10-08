"use client";

import { B2B_SEGMENT_LABELS, SegmentPicker } from "@/components/auth/SegmentPicker";
import { Input } from "@/components/ui/Input";
import type { B2BApplicationInput } from "@/types";

export { B2B_SEGMENT_LABELS };

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
      <SegmentPicker value={value.segment} onChange={(segment) => set({ segment })} />
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
