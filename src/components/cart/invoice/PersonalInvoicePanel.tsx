"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { areaClass, inputClass, labelClass, noteClass, quietButtonClass } from "@/components/cart/invoice/fields";
import { Alert } from "@/components/ui/Alert";
import { addressSummary } from "@/components/cart/delivery/addressDraft";
import { countryName } from "@/lib/countries";
import { getApiErrorMessage } from "@/lib/errors";
import { checkoutMessages } from "@/lib/i18n/messages/checkout";
import { saveBillingAddress } from "@/lib/ordersApi";
import { TR_PROVINCES } from "@/lib/provinces";
import type { SavedAddress } from "@/types";

interface Draft {
  city: string;
  district: string;
  line: string;
}

/**
 * "Fatura adresim": the address the invoice is made out to when it is made out
 * to the customer themselves.
 *
 * Shown as it stands, with "Düzenle" for the usual reason an invoice address
 * needs it — a kapı no missing, a street written better. Saving writes it to
 * the account, so the correction holds for the next order too; the order itself
 * keeps its own copy whatever happens here.
 */
export function PersonalInvoicePanel({
  address,
  loading,
  onSaved,
}: {
  /** The BILLING row on file; null when the account has none. */
  address: SavedAddress | null;
  loading: boolean;
  /** Re-read the addresses, so the delivery card below shows the new one. */
  onSaved: () => void;
}) {
  const locale = useLocale();
  const m = useMessages(checkoutMessages);
  const t = m.personal;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const usable =
    !!draft?.city && draft.district.trim().length >= 2 && draft.line.trim().length >= 5;

  function edit() {
    setResult(null);
    setDraft({
      city: address?.city ?? "",
      district: address?.district ?? "",
      line: address?.line ?? "",
    });
  }

  async function save() {
    if (!draft || !usable || saving) return;
    setSaving(true);
    setResult(null);
    try {
      await saveBillingAddress({
        city: draft.city,
        district: draft.district.trim(),
        line: draft.line.trim(),
      });
      setDraft(null);
      setResult({ kind: "success", text: t.updated });
      onSaved();
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, t.saveFailed) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-200 p-3 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {address?.full_name ?? m.invoice.personalTitle}
          </p>
          {/* One line either way, so opening the cart does not shift it. */}
          {loading ? (
            <p className="mt-1.5 h-4 w-2/3 rounded bg-slate-200 motion-safe:animate-pulse dark:bg-white/10" aria-busy />
          ) : (
            <p className={`mt-1 ${noteClass}`}>
              {address
                ? addressSummary(address, (code) => countryName(code, locale))
                : t.none}
            </p>
          )}
        </div>
        {draft === null && (
          <button type="button" onClick={edit} className={quietButtonClass}>
            <Pencil className="h-3.5 w-3.5" aria-hidden /> {m.invoice.edit}
          </button>
        )}
      </div>

      {draft !== null && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="billing-city" className={labelClass}>
              {m.place.city}
            </label>
            <select
              id="billing-city"
              value={draft.city}
              onChange={(e) => setDraft({ ...draft, city: e.target.value })}
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
            <label htmlFor="billing-district" className={labelClass}>
              {m.place.district}
            </label>
            <input
              id="billing-district"
              maxLength={80}
              value={draft.district}
              onChange={(e) => setDraft({ ...draft, district: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="billing-line" className={labelClass}>
              {t.line}
            </label>
            <textarea
              id="billing-line"
              rows={2}
              maxLength={200}
              value={draft.line}
              onChange={(e) => setDraft({ ...draft, line: e.target.value })}
              placeholder={m.address.linePlaceholder}
              className={areaClass}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <button type="button" onClick={save} disabled={!usable || saving} className={quietButtonClass}>
              <Check className="h-3.5 w-3.5" aria-hidden /> {saving ? m.invoice.saving : t.save}
            </button>
            <button type="button" onClick={() => setDraft(null)} className={quietButtonClass}>
              {t.cancel}
            </button>
            <p className={noteClass}>{t.saveNote}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-3">
          <Alert variant={result.kind === "success" ? "success" : "error"}>{result.text}</Alert>
        </div>
      )}
    </div>
  );
}
