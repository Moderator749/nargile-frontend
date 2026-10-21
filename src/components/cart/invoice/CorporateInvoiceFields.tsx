"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import {
  areaClass,
  inputClass,
  labelClass,
  noteClass,
  quietButtonClass,
} from "@/components/cart/invoice/fields";
import {
  invoiceAddressSummary,
  invoiceProblem,
  toCorporatePayload,
  type InvoiceDraft,
} from "@/components/cart/invoiceDraft";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import { checkoutMessages } from "@/lib/i18n/messages/checkout";
import { saveCorporateInvoice } from "@/lib/ordersApi";
import { TR_PROVINCES } from "@/lib/provinces";
import type { CorporateInvoiceDetails } from "@/types";

/**
 * "Faturayı firmaya/şirkete istiyorum": everything an invoice to a firm needs,
 * in the order the blueprint asks for it — the registered ünvan, the name it
 * trades under, where it is registered, its vergi dairesi and its tax number.
 *
 * A firm already on file is shown as a summary with "Düzenle", because the
 * common case is the same firm every month and nothing to retype. "Kaydet"
 * writes it to the account; the order carries its own copy regardless, so a
 * one-off invoice to somebody else's firm need never be saved.
 */
export function CorporateInvoiceFields({
  value,
  onChange,
  onFile,
  onSaved,
}: {
  value: InvoiceDraft;
  onChange: (patch: Partial<InvoiceDraft>) => void;
  /** What the account already keeps, or null when it keeps nothing. */
  onFile: CorporateInvoiceDetails | null;
  onSaved: (details: CorporateInvoiceDetails) => void;
}) {
  const locale = useLocale();
  const m = useMessages(checkoutMessages);
  const t = m.corporate;
  // A firm on file opens collapsed; anything else opens as a form to fill in.
  const [editing, setEditing] = useState(onFile === null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const problem = invoiceProblem({ ...value, toCompany: true }, locale);

  async function save() {
    if (problem || saving) return;
    setSaving(true);
    setResult(null);
    try {
      const saved = await saveCorporateInvoice(toCorporatePayload(value));
      onSaved(saved);
      setResult({ kind: "success", text: t.saved });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, t.saveFailed) });
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-5 rounded-xl border border-slate-200 p-3 dark:border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {value.companyTitle}
            </p>
            {value.tradeName.trim() && <p className={noteClass}>{value.tradeName}</p>}
            <p className={`mt-1 ${noteClass}`}>{invoiceAddressSummary(value)}</p>
            <p className={`mt-1 ${noteClass}`}>
              {value.taxOffice} · {value.taxNumber}
            </p>
          </div>
          <button type="button" onClick={() => setEditing(true)} className={quietButtonClass}>
            <Pencil className="h-3.5 w-3.5" aria-hidden /> {m.invoice.edit}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="invoice-title" className={labelClass}>
          {t.title}
        </label>
        <input
          id="invoice-title"
          maxLength={200}
          required
          autoComplete="organization"
          value={value.companyTitle}
          onChange={(e) => onChange({ companyTitle: e.target.value })}
          placeholder={t.titlePlaceholder}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="invoice-trade-name" className={labelClass}>
          {t.tradeName}
        </label>
        <input
          id="invoice-trade-name"
          maxLength={200}
          value={value.tradeName}
          onChange={(e) => onChange({ tradeName: e.target.value })}
          placeholder={t.tradeNamePlaceholder}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="invoice-line" className={labelClass}>
          {t.line}
        </label>
        <textarea
          id="invoice-line"
          rows={2}
          maxLength={200}
          required
          value={value.line}
          onChange={(e) => onChange({ line: e.target.value })}
          placeholder={t.linePlaceholder}
          className={areaClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="invoice-city" className={labelClass}>
          {m.place.city}
        </label>
        <select
          id="invoice-city"
          required
          value={value.city}
          onChange={(e) => onChange({ city: e.target.value })}
          className={inputClass}
        >
          <option value="">{m.place.select}</option>
          {TR_PROVINCES.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="invoice-district" className={labelClass}>
          {m.place.district}
        </label>
        <input
          id="invoice-district"
          maxLength={80}
          required
          value={value.district}
          onChange={(e) => onChange({ district: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="invoice-tax-office" className={labelClass}>
          {t.taxOffice}
        </label>
        <input
          id="invoice-tax-office"
          maxLength={100}
          required
          value={value.taxOffice}
          onChange={(e) => onChange({ taxOffice: e.target.value })}
          placeholder={t.taxOfficePlaceholder}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="invoice-tax-number" className={labelClass}>
          {t.taxNumber}
        </label>
        <input
          id="invoice-tax-number"
          inputMode="numeric"
          maxLength={20}
          required
          value={value.taxNumber}
          onChange={(e) => onChange({ taxNumber: e.target.value })}
          placeholder={t.taxNumberPlaceholder}
          className={inputClass}
        />
        <p className={noteClass}>{t.taxNumberNote}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button type="button" onClick={save} disabled={!!problem || saving} className={quietButtonClass}>
          <Check className="h-3.5 w-3.5" aria-hidden />
          {saving ? m.invoice.saving : t.saveToAccount}
        </button>
        <p className={noteClass}>
          {problem ?? t.saveNote}
        </p>
      </div>

      {result && (
        <div className="sm:col-span-2">
          <Alert variant={result.kind === "success" ? "success" : "error"}>{result.text}</Alert>
        </div>
      )}
    </div>
  );
}
