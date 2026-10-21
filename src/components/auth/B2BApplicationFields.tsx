"use client";

import { B2B_SEGMENT_LABELS, SegmentPicker } from "@/components/auth/SegmentPicker";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { Input } from "@/components/ui/Input";
import type { Locale } from "@/lib/i18n/config";
import { b2bFieldMessages } from "@/lib/i18n/messages/auth";
import type { B2BApplicationInput } from "@/types";

export { B2B_SEGMENT_LABELS };

export const EMPTY_APPLICATION: B2BApplicationInput = { segment: "CAFE", company_title: "", tax_number: "", tax_office: "" };

/** Mirrors the server's checks; null = valid. The message is in `locale` (Turkish by default). */
export function applicationProblem(a: B2BApplicationInput, locale: Locale = "tr"): string | null {
  const m = b2bFieldMessages[locale].problems;
  if (a.company_title.trim().length < 2) return m.companyTitle;
  if (!/^\d{10,11}$/.test(a.tax_number.replace(/\s+/g, ""))) return m.taxNumber;
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
  const m = useMessages(b2bFieldMessages);
  const set = (patch: Partial<B2BApplicationInput>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-4">
      <SegmentPicker value={value.segment} onChange={(segment) => set({ segment })} />
      <Input label={m.companyTitle} value={value.company_title} maxLength={255} onChange={(e) => set({ company_title: e.target.value })} autoComplete="organization" />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={m.taxNumber}
          inputMode="numeric"
          value={value.tax_number}
          maxLength={11}
          onChange={(e) => set({ tax_number: e.target.value.replace(/\D/g, "") })}
        />
        <Input label={m.taxOffice} value={value.tax_office ?? ""} maxLength={100} onChange={(e) => set({ tax_office: e.target.value })} />
      </div>
    </div>
  );
}
