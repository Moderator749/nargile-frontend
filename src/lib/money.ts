// Display currency conversion (TCMB rates). Display only: checkout is always in TRY.

import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { DisplayCurrency } from "@/store/useCurrencyStore";
import type { CatalogPrice, DecimalString, ExchangeRates } from "@/types";

let ratesPromise: Promise<ExchangeRates | null> | null = null;

/** Fetched once per page load and shared; null when TCMB rates are unavailable. */
export function loadExchangeRates(): Promise<ExchangeRates | null> {
  ratesPromise ??= api
    .get<ExchangeRates>("/exchange-rates")
    .then((r) => r.data)
    .catch(() => {
      ratesPromise = null; // let a later render retry
      return null;
    });
  return ratesPromise;
}

/**
 * Formats a TRY amount in the display currency: "₺1.200,00", or "≈ $24,41"
 * when converted. Falls back to TRY when rates are missing.
 */
export function formatDisplayMoney(
  amountTry: DecimalString | number,
  currency: DisplayCurrency,
  rates: ExchangeRates | null,
): string {
  if (currency === "TRY" || !rates) return formatMoney(amountTry, "TRY");
  const rate = Number(rates.rates[currency]);
  if (!(rate > 0)) return formatMoney(amountTry, "TRY");
  return `≈ ${formatMoney(Number(amountTry) / rate, currency)}`;
}

export const formatDisplayPrice = (price: CatalogPrice, currency: DisplayCurrency, rates: ExchangeRates | null) =>
  price.currency === "TRY"
    ? formatDisplayMoney(price.price_incl_tax, currency, rates)
    : formatMoney(price.price_incl_tax, price.currency);
