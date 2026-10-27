"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { RichText } from "@/components/ui/RichText";
import { Dialog } from "@/components/ui/Dialog";
import { cartMessages } from "@/lib/i18n/messages/cart";
import type { LegalDocument, LegalKey } from "@/types";

export interface Agreements {
  distanceSales: boolean;
  terms: boolean;
}

export const NO_AGREEMENTS: Agreements = { distanceSales: false, terms: false };

/** Which box maps to which document; the sentence beside it is in `cartMessages.legal`. */
const ITEMS: { field: keyof Agreements; key: LegalKey }[] = [
  { field: "distanceSales", key: "DISTANCE_SALES" },
  { field: "terms", key: "TERMS" },
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
  const t = useMessages(cartMessages).legal;
  const [open, setOpen] = useState<LegalKey | null>(null);
  const shown = open ? documents?.[open] : undefined;
  // The sentence, and the document's name until the panel's own title arrives.
  const words = (field: keyof Agreements) =>
    field === "distanceSales"
      ? { label: t.distanceSales, fallback: t.distanceSalesTitle }
      : { label: t.terms, fallback: t.termsTitle };
  const openItem = ITEMS.find((item) => item.key === open);

  return (
    <div className="space-y-2 rounded-xl bg-slate-50 px-3 py-3 dark:bg-white/5">
      {ITEMS.map(({ field, key }) => (
        <div key={field} className="flex items-start gap-2.5 text-xs leading-5">
          <input
            id={`agreement-${field}`}
            type="checkbox"
            checked={value[field]}
            onChange={(e) => onChange({ [field]: e.target.checked } as Partial<Agreements>)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
          />
          <label htmlFor={`agreement-${field}`} className="cursor-pointer text-slate-600 dark:text-zinc-300">
            {words(field).label}
          </label>
          <button
            type="button"
            onClick={() => setOpen(key)}
            aria-label={t.readAria(documents?.[key]?.title ?? words(field).fallback)}
            className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 font-medium text-red-700 transition-colors duration-200 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {t.read}
          </button>
        </div>
      ))}

      <Dialog
        open={open !== null}
        onClose={() => setOpen(null)}
        title={shown?.title ?? (openItem ? words(openItem.field).fallback : t.dialogFallback)}
      >
        {shown ? (
          <RichText html={shown.body} nested className="text-sm text-slate-700 dark:text-zinc-300" />
        ) : (
          <p className="text-sm text-slate-500 dark:text-zinc-400">{t.loadFailed}</p>
        )}
      </Dialog>
    </div>
  );
}

/**
 * "Kampanya ve fırsatlardan haberdar olmak istiyorum": ticari elektronik ileti
 * onayı, asked beside the agreements but apart from them — it is optional,
 * starts unticked, and an order never waits on it. Ticked, the order records
 * both consents on the account; unticked, nothing changes.
 */
export function MarketingConsent({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  const t = useMessages(cartMessages).legal;
  return (
    <div className="flex items-start gap-2.5 px-3 text-xs leading-5">
      <input
        id="marketing-consent"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby="marketing-consent-hint"
        className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
      />
      <div>
        <label htmlFor="marketing-consent" className="cursor-pointer text-slate-600 dark:text-zinc-300">
          {t.marketing}
        </label>
        <p id="marketing-consent-hint" className="text-[11px] text-slate-400 dark:text-zinc-500">
          {t.marketingHint}
        </p>
      </div>
    </div>
  );
}
