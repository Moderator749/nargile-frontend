"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

import { RichText } from "@/components/ui/RichText";
import { Dialog } from "@/components/ui/Dialog";
import type { LegalDocument, LegalKey } from "@/types";

export interface Agreements {
  distanceSales: boolean;
  terms: boolean;
}

export const NO_AGREEMENTS: Agreements = { distanceSales: false, terms: false };

/** Which box maps to which document, and what the sentence beside it says. */
const ITEMS: { field: keyof Agreements; key: LegalKey; label: string; fallback: string }[] = [
  {
    field: "distanceSales",
    key: "DISTANCE_SALES",
    label: "Mesafeli Satış Sözleşmesi'ni okudum ve kabul ediyorum",
    fallback: "Mesafeli Satış Sözleşmesi",
  },
  {
    field: "terms",
    key: "TERMS",
    label: "Şartlar ve Kurallar Sözleşmesi'ni okudum ve kabul ediyorum",
    fallback: "Şartlar ve Kurallar Sözleşmesi",
  },
];

/**
 * The two agreements an order cannot be placed without. The server refuses a
 * checkout that does not carry both, so this is the same gate on both sides
 * rather than a courtesy.
 *
 * The name of each agreement opens its text, which is read live from the panel:
 * what the shop last saved is what the buyer accepts.
 */
export function LegalConsent({
  value,
  onChange,
  documents,
}: {
  value: Agreements;
  onChange: (patch: Partial<Agreements>) => void;
  documents: Partial<Record<LegalKey, LegalDocument>> | null;
}) {
  const [open, setOpen] = useState<LegalKey | null>(null);
  const shown = open ? documents?.[open] : undefined;

  return (
    <div className="space-y-2 rounded-xl bg-slate-50 px-3 py-3 dark:bg-white/5">
      {ITEMS.map(({ field, key, label, fallback }) => (
        <div key={field} className="flex items-start gap-2.5 text-xs leading-5">
          <input
            id={`agreement-${field}`}
            type="checkbox"
            checked={value[field]}
            onChange={(e) => onChange({ [field]: e.target.checked } as Partial<Agreements>)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
          />
          <label htmlFor={`agreement-${field}`} className="cursor-pointer text-slate-600 dark:text-zinc-300">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setOpen(key)}
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 font-medium text-red-700 transition-colors duration-200 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">{documents?.[key]?.title ?? fallback} metnini </span>Oku
          </button>
        </div>
      ))}

      <Dialog
        open={open !== null}
        onClose={() => setOpen(null)}
        title={shown?.title ?? ITEMS.find((item) => item.key === open)?.fallback ?? "Sözleşme"}
      >
        {shown ? (
          <RichText html={shown.body} nested className="text-sm text-slate-700 dark:text-zinc-300" />
        ) : (
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Sözleşme metni yüklenemedi. Sayfayı yenileyip tekrar deneyebilirsiniz.
          </p>
        )}
      </Dialog>
    </div>
  );
}
