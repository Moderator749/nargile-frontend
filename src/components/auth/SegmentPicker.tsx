"use client";

import { radioCardClass } from "@/components/auth/FormSection";
import type { B2BSegment } from "@/types";

export const B2B_SEGMENT_LABELS: Record<B2BSegment, string> = {
  CAFE: "Kafe / Restoran",
  WHOLESALE: "Toptancı",
  DEALER: "Bayi",
};

/**
 * Which price list the customer is asking for, on the account page — sign-up
 * does not ask. Asking is all it is: an admin grants the segment after checking
 * the documents, and until then the account pays retail.
 */
export function SegmentPicker({
  value,
  onChange,
}: {
  value: B2BSegment;
  onChange: (value: B2BSegment) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">İşletme türü</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {(Object.keys(B2B_SEGMENT_LABELS) as B2BSegment[]).map((segment) => (
          <label key={segment} className={`${radioCardClass(value === segment)} justify-center text-center`}>
            <input
              type="radio"
              name="b2b_segment"
              value={segment}
              checked={value === segment}
              onChange={() => onChange(segment)}
              className="sr-only"
            />
            <span className={value === segment ? "font-semibold" : undefined}>{B2B_SEGMENT_LABELS[segment]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
