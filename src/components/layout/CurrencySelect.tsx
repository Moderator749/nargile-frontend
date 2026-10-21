"use client";

import { ChevronDown } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { chromeMessages } from "@/lib/i18n/messages/layout";
import { DISPLAY_CURRENCIES, useCurrencyStore, type DisplayCurrency } from "@/store/useCurrencyStore";

// Lira as the shop writes it beside every price: "TL".
const SYMBOL: Record<DisplayCurrency, string> = { TRY: "TL", USD: "$ USD", EUR: "€ EUR" };

/** Display currency (TCMB rates, approximate). Checkout always charges TRY. */
export function CurrencySelect() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const m = useMessages(chromeMessages);

  return (
    <div className="relative shrink-0">
      <label htmlFor="display-currency" className="sr-only">
        {m.currencyLabel}
      </label>
      <select
        id="display-currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as DisplayCurrency)}
        title={m.currencyTitle}
        className="h-9 cursor-pointer appearance-none rounded-full bg-transparent pe-7 ps-3 font-mono text-xs text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {DISPLAY_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {SYMBOL[c]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
