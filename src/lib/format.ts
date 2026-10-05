import type { CatalogPrice, CurrencyType, DecimalString } from "@/types";

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats a backend Decimal string or number, e.g. "1200.00" TRY → "₺1.200,00". */
export function formatMoney(amount: DecimalString | number, currency: CurrencyType = "TRY"): string {
  let fmt = formatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency });
    formatters.set(currency, fmt);
  }
  return fmt.format(Number(amount));
}

export function formatPrice(price: CatalogPrice): string {
  return formatMoney(price.price_incl_tax, price.currency);
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
