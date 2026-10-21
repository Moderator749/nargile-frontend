"use client";

import { Truck } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { cartMessages } from "@/lib/i18n/messages/cart";

/**
 * The wording the buyer accepts, in Turkish; the server refuses the order
 * without it. The page shows it in its own language (`cartMessages.consent`).
 */
export const SHIPPING_CONSENT_TEXT = cartMessages.tr.consent.text;

/**
 * Mandatory consent for a "karşı ödemeli" shipment, shown right above the
 * checkout button. The shop adds no carriage to the order; the buyer pays the
 * carrier on delivery, so this has to be ticked before the order can be placed.
 */
export function ShippingConsent({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const t = useMessages(cartMessages).consent;
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-xs leading-5 transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
        checked
          ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
          : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
      }`}
    >
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
      />
      <span>
        <span className="flex items-center gap-1.5 font-semibold">
          <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden /> {t.title}
        </span>
        <span className="mt-0.5 block">{t.text}</span>
      </span>
    </label>
  );
}
