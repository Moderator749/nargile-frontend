"use client";

import { Building2, ReceiptText } from "lucide-react";

import type { InvoiceDraft } from "@/components/cart/invoiceDraft";

const cardClass = (selected: boolean) =>
  `flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-[color,background-color,border-color,opacity] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
    selected
      ? "border-red-600 bg-red-50/60 ring-1 ring-red-600 dark:border-red-400 dark:bg-red-500/10 dark:ring-red-400"
      : "border-slate-200 bg-slate-50 opacity-70 hover:border-slate-400 hover:opacity-100 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/25"
  }`;

const inputClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";

const OPTIONS = [
  {
    toCompany: false,
    title: "Fatura adresim",
    hint: "Fatura kendi adınıza düzenlenir.",
    Icon: ReceiptText,
  },
  {
    toCompany: true,
    title: "Faturayı firmaya/şirkete istiyorum",
    hint: "Fatura, aşağıda belirttiğiniz firma adına düzenlenir.",
    Icon: Building2,
  },
] as const;

/**
 * Fatura bilgileri: whose name the invoice is made out to.
 *
 * A personal order invoiced to a firm needs the three things an invoice cannot
 * be issued without. They are asked for only when that option is chosen, and
 * they change nothing about the account itself — this is one order's invoice.
 */
export function InvoicePicker({
  value,
  onChange,
}: {
  value: InvoiceDraft;
  onChange: (patch: Partial<InvoiceDraft>) => void;
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

      {value.toCompany && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="invoice-title" className={labelClass}>
              Firma Ünvanı
            </label>
            <input
              id="invoice-title"
              maxLength={200}
              required
              autoComplete="organization"
              value={value.companyTitle}
              onChange={(e) => onChange({ companyTitle: e.target.value })}
              placeholder="Fatura üzerinde görünecek tam ünvan"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="invoice-tax-office" className={labelClass}>
              Vergi Dairesi
            </label>
            <input
              id="invoice-tax-office"
              maxLength={100}
              required
              value={value.taxOffice}
              onChange={(e) => onChange({ taxOffice: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="invoice-tax-number" className={labelClass}>
              Vergi No / VKN
            </label>
            <input
              id="invoice-tax-number"
              inputMode="numeric"
              maxLength={20}
              required
              value={value.taxNumber}
              onChange={(e) => onChange({ taxNumber: e.target.value })}
              placeholder="10 haneli"
              className={inputClass}
            />
          </div>
        </div>
      )}
    </section>
  );
}
