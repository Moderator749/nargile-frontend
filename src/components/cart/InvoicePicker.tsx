"use client";

import { Building2, ReceiptText } from "lucide-react";

import { CorporateInvoiceFields } from "@/components/cart/invoice/CorporateInvoiceFields";
import { PersonalInvoicePanel } from "@/components/cart/invoice/PersonalInvoicePanel";
import { labelClass } from "@/components/cart/invoice/fields";
import type { InvoiceDraft } from "@/components/cart/invoiceDraft";
import type { CorporateInvoiceDetails, SavedAddress } from "@/types";

const cardClass = (selected: boolean) =>
  `flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-[color,background-color,border-color,opacity] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
    selected
      ? "border-red-600 bg-red-50/60 ring-1 ring-red-600 dark:border-red-400 dark:bg-red-500/10 dark:ring-red-400"
      : "border-slate-200 bg-slate-50 opacity-70 hover:border-slate-400 hover:opacity-100 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/25"
  }`;

const OPTIONS = [
  {
    toCompany: false,
    title: "Fatura adresim",
    hint: "Fatura, kayıtlı ad ve adresinizle kendi adınıza düzenlenir.",
    Icon: ReceiptText,
  },
  {
    toCompany: true,
    title: "Faturayı firmaya/şirkete istiyorum",
    hint: "Fatura, aşağıda belirttiğiniz firma adına ve adresine düzenlenir.",
    Icon: Building2,
  },
] as const;

/**
 * Fatura bilgileri: whose name the invoice is made out to, and where.
 *
 * It comes first in the cart because it is the first decision: a buyer writing
 * the purchase off to their firm settles that before deciding where the goods
 * go — and the delivery step below then offers that firm's address as one of
 * its cards, alongside home, a branch and a one-off address.
 *
 * Either side can be corrected here and saved to the account, so the next cart
 * starts from it. What the order records is a copy taken at checkout, which is
 * what keeps an invoice issued in March from changing in April.
 */
export function InvoicePicker({
  value,
  onChange,
  billingAddress,
  addressesLoading,
  onBillingAddressSaved,
  corporateOnFile,
  onCorporateSaved,
}: {
  value: InvoiceDraft;
  onChange: (patch: Partial<InvoiceDraft>) => void;
  /** The customer's own invoice address, as the account has it. */
  billingAddress: SavedAddress | null;
  addressesLoading: boolean;
  onBillingAddressSaved: () => void;
  corporateOnFile: CorporateInvoiceDetails | null;
  onCorporateSaved: (details: CorporateInvoiceDetails) => void;
}) {
  return (
    <section
      aria-labelledby="invoice-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6"
    >
      <h2 id="invoice-heading" className="text-lg font-bold tracking-tight">
        Fatura Bilgileri
      </h2>

      <fieldset className="mt-5">
        <legend className={labelClass}>Fatura kime düzenlenecek?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {OPTIONS.map(({ toCompany, title, hint, Icon }) => {
            const selected = value.toCompany === toCompany;
            return (
              <label key={title} className={cardClass(selected)}>
                <input
                  type="radio"
                  name="invoice_target"
                  checked={selected}
                  onChange={() => onChange({ toCompany })}
                  className="sr-only"
                />
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-zinc-500"}`}
                  aria-hidden
                />
                <span>
                  <span className="block font-semibold text-slate-900 dark:text-zinc-100">{title}</span>
                  <span className="block text-xs text-slate-500 dark:text-zinc-400">{hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {value.toCompany ? (
        <CorporateInvoiceFields
          value={value}
          onChange={onChange}
          onFile={corporateOnFile}
          onSaved={onCorporateSaved}
        />
      ) : (
        <PersonalInvoicePanel
          address={billingAddress}
          loading={addressesLoading}
          onSaved={onBillingAddressSaved}
        />
      )}
    </section>
  );
}
