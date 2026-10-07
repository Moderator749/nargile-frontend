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

const dayFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

/** Date and time in separate cells, for the order sheet's TARİH | SAAT columns. */
export function formatDateParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return { date: dayFormatter.format(d), time: timeFormatter.format(d) };
}

/**
 * Parses a money/percent field typed by a Turkish user: "1.250,50", "1250,5" or
 * "1250.50" → "1250.50". Returns null for anything that isn't a non-negative number.
 */
export function parseDecimalInput(raw: string): string | null {
  let s = raw.trim().replace(/\s|₺|%/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  // "1.250" / "12.500.000" are Turkish thousands separators, not decimals.
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Number(s).toFixed(2);
}

/** Price excluding VAT from a VAT-inclusive price, rounded to kuruş. */
export function excludeVat(inclTax: string, vatRate: string): string {
  return (Number(inclTax) / (1 + Number(vatRate) / 100)).toFixed(2);
}
