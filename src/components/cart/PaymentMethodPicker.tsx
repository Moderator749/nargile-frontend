import { CreditCard, Landmark } from "lucide-react";

import type { PaymentMethod } from "@/types";

const OPTIONS: { value: PaymentMethod; title: string; hint: string; Icon: typeof CreditCard }[] = [
  { value: "CREDIT_CARD", title: "Kredi Kartı", hint: "Anında onay", Icon: CreditCard },
  {
    value: "BANK_TRANSFER",
    title: "Havale / EFT",
    // Mirrors checkout_engine: 5% below ₺30.000, 7% from ₺30.000.
    hint: "%5 indirim (₺30.000 üzeri %7)",
    Icon: Landmark,
  },
];

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700">Ödeme yöntemi</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {OPTIONS.map(({ value: option, title, hint, Icon }) => (
          <label
            key={option}
            className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/40 ${
              value === option
                ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input
              type="radio"
              name="payment_method"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span className="flex items-center gap-2 font-semibold text-slate-900">
              <Icon className="h-4 w-4" aria-hidden /> {title}
            </span>
            <span className="text-xs text-slate-500">{hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
