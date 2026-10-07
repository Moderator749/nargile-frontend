"use client";

import { ChevronDown } from "lucide-react";

import { DISPLAY_CURRENCIES, useCurrencyStore, type DisplayCurrency } from "@/store/useCurrencyStore";

const SYMBOL: Record<DisplayCurrency, string> = { TRY: "₺ TRY", USD: "$ USD", EUR: "€ EUR" };

/** Display currency (TCMB rates, approximate). Checkout always charges TRY. */
export function CurrencySelect() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  return (
    <div className="relative shrink-0">
      <label htmlFor="display-currency" className="sr-only">
        Para birimi (yaklaşık; ödeme TL ile yapılır)
      </label>
      <select
        id="display-currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as DisplayCurrency)}
        title="Fiyatlar TCMB kuruyla yaklaşık gösterilir; ödeme TL ile yapılır."
        className="h-9 cursor-pointer appearance-none rounded-full bg-transparent pl-3 pr-7 font-mono text-xs text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {DISPLAY_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {SYMBOL[c]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
