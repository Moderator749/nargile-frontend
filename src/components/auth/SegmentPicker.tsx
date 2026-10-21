"use client";

import { radioCardClass } from "@/components/auth/FormSection";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { b2bFieldMessages } from "@/lib/i18n/messages/auth";
import type { B2BSegment } from "@/types";

/** In Turkish, for the admin panel; the storefront reads b2bFieldMessages in the page's language. */
export const B2B_SEGMENT_LABELS: Record<B2BSegment, string> = b2bFieldMessages.tr.segments;

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
  const m = useMessages(b2bFieldMessages);
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">{m.segment}</legend>
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
            <span className={value === segment ? "font-semibold" : undefined}>{m.segments[segment]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
