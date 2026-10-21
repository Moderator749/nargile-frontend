"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { checkoutMessages } from "@/lib/i18n/messages/checkout";
import type { ShippingMethod } from "@/types";

const inputClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";
const noteClass = "text-xs text-slate-500 dark:text-zinc-400";
/** A phone number reads left to right on an Arabic page too; it only sits on the right. */
const phoneClass = `${inputClass} rtl:text-right`;

export interface MethodDetails {
  contractNo: string;
  freightCompanyName: string;
  freightPhone: string;
}

/**
 * What a method asks for beyond being chosen, revealed inside the option it
 * belongs to.
 *
 * Both are optional: a firm with its own Yurtiçi agreement has the carriage
 * billed to it, and a firm that already knows which ambar it uses saves the
 * shop a phone call. Neither is required to order, and the server keeps only
 * the pair that matches the chosen method.
 */
export function MethodFields({
  method,
  value,
  onChange,
}: {
  method: ShippingMethod;
  value: MethodDetails;
  onChange: (patch: Partial<MethodDetails>) => void;
}) {
  const t = useMessages(checkoutMessages).method;
  if (method === "YURTICI_DOOR") {
    return (
      <div className="space-y-1.5">
        <p className={noteClass}>{t.contractNote}</p>
        <label htmlFor="shipping-contract" className={labelClass}>
          {t.contractLabel}
        </label>
        <input
          id="shipping-contract"
          maxLength={50}
          value={value.contractNo}
          onChange={(e) => onChange({ contractNo: e.target.value })}
          placeholder={t.contractPlaceholder}
          className={inputClass}
        />
      </div>
    );
  }

  if (method === "NAKLIYE_AMBARI") {
    return (
      <div className="space-y-3">
        <p className={noteClass}>{t.freightNote}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="freight-name" className={labelClass}>
              {t.freightName}
            </label>
            <input
              id="freight-name"
              maxLength={150}
              value={value.freightCompanyName}
              onChange={(e) => onChange({ freightCompanyName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="freight-phone" className={labelClass}>
              {t.phone}
            </label>
            <input
              id="freight-phone"
              type="tel"
              inputMode="tel"
              maxLength={30}
              dir="ltr"
              value={value.freightPhone}
              onChange={(e) => onChange({ freightPhone: e.target.value })}
              placeholder="0212 000 00 00"
              className={phoneClass}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/** "Başka biri teslim alacak" and the two fields it reveals. */
export function ReceiverFields({
  checked,
  onCheckedChange,
  name,
  phone,
  onChange,
  idPrefix,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  name: string;
  phone: string;
  onChange: (patch: { receiverName?: string; receiverPhone?: string }) => void;
  /** The toggle appears in two places; the fields' ids have to differ. */
  idPrefix: string;
}) {
  const t = useMessages(checkoutMessages).receiver;
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-red-600"
        />
        <span>
          <span className="font-medium">{t.toggle}</span>
          <span className={`block ${noteClass}`}>{t.toggleNote}</span>
        </span>
      </label>
      {checked && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor={`${idPrefix}-receiver-name`} className={labelClass}>
              {t.name}
            </label>
            <input
              id={`${idPrefix}-receiver-name`}
              autoComplete="off"
              maxLength={150}
              required
              value={name}
              onChange={(e) => onChange({ receiverName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${idPrefix}-receiver-phone`} className={labelClass}>
              {t.phone}
            </label>
            <input
              id={`${idPrefix}-receiver-phone`}
              type="tel"
              inputMode="tel"
              maxLength={30}
              required
              dir="ltr"
              placeholder="05xx xxx xx xx"
              value={phone}
              onChange={(e) => onChange({ receiverPhone: e.target.value })}
              className={phoneClass}
            />
          </div>
        </div>
      )}
    </div>
  );
}
