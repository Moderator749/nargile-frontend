"use client";

import { CreditCard, Landmark, ShieldCheck } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { cartMessages } from "@/lib/i18n/messages/cart";

import type { PaymentMethod } from "@/types";

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  /**
   * The havale discount to advertise ("%5 indirim (₺30.000 üzeri %7)", from
   * the live parameters), or null for none. It is a retail promotion, so a B2B
   * account is not promised one it would not receive — it pays its tier price
   * either way.
   */
  transferDiscount: string | null;
  /** Whether card payment (PayTR) is open; false greys the card option out. */
  cardAvailable: boolean;
  /** "Kart bilgilerimi sonraki alışverişlerim için güvenle kaydet". */
  saveCard: boolean;
  onSaveCardChange: (checked: boolean) => void;
}

export function PaymentMethodPicker({
  value,
  onChange,
  transferDiscount,
  cardAvailable,
  saveCard,
  onSaveCardChange,
}: PaymentMethodPickerProps) {
  const t = useMessages(cartMessages).payment;
  const options: { value: PaymentMethod; title: string; hint: string; Icon: typeof CreditCard; disabled?: boolean }[] = [
    {
      value: "CREDIT_CARD",
      title: t.card,
      hint: cardAvailable ? t.cardHint : t.cardUnavailable,
      Icon: CreditCard,
      disabled: !cardAvailable,
    },
    {
      value: "BANK_TRANSFER",
      title: t.transfer,
      hint: transferDiscount ?? t.transferHint,
      Icon: Landmark,
    },
  ];
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">{t.legend}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map(({ value: option, title, hint, Icon, disabled }) => (
          <label
            key={option}
            className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
              value === option
                ? "border-red-600 dark:border-red-400 bg-red-50/60 dark:bg-red-500/10 ring-1 ring-red-600 dark:ring-red-400"
                : "border-slate-300 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/25"
            }`}
          >
            <input
              type="radio"
              name="payment_method"
              value={option}
              checked={value === option}
              disabled={disabled}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-zinc-100">
              <Icon className="h-4 w-4" aria-hidden /> {title}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">{hint}</span>
          </label>
        ))}
      </div>
      {/* Only the card has anything to save. The card itself never reaches us:
          the payment provider keeps the token, and the order only remembers
          that it was asked for. */}
      {value === "CREDIT_CARD" && (
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-xs leading-5">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => onSaveCardChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
          />
          <span className="text-slate-600 dark:text-zinc-300">
            <span className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-zinc-100">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              {t.saveCard}
            </span>
            {t.saveCardNote}
          </span>
        </label>
      )}
    </fieldset>
  );
}
