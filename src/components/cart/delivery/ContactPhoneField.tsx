"use client";

import { phoneProblem } from "@/components/cart/delivery/addressDraft";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { checkoutMessages } from "@/lib/i18n/messages/checkout";

const inputClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 aria-[invalid=true]:border-red-500 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 rtl:text-right";

/**
 * The order's phone number, asked once whichever card is picked: the courier
 * calls it, PayTR is given it, and the order's SMS goes to it. It opens on the
 * account's own number; an account without one gets the number it orders with.
 */
export function ContactPhoneField({
  value,
  onChange,
  abroad,
}: {
  value: string;
  onChange: (value: string) => void;
  abroad: boolean;
}) {
  const locale = useLocale();
  const m = useMessages(checkoutMessages);
  // Said once something has been typed: an empty field is the blocker's to name.
  const problem = value.trim() ? phoneProblem(value, abroad, locale) : null;

  return (
    <div className="mt-4 max-w-sm space-y-1.5">
      <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
        {abroad ? m.export.address.phone : m.delivery.contactPhone}
      </label>
      <input
        id="contact-phone"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        maxLength={30}
        dir="ltr"
        required
        aria-invalid={problem ? true : undefined}
        aria-describedby="contact-phone-hint"
        placeholder={abroad ? m.export.address.phonePlaceholder : m.address.phonePlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      <p id="contact-phone-hint" className={problem ? "text-xs text-red-600 dark:text-red-400" : "text-xs text-slate-500 dark:text-zinc-400"}>
        {problem ?? m.delivery.contactHint}
      </p>
    </div>
  );
}
