import type { CatalogPrice } from "@/types";

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats a backend Decimal string, e.g. "1200.00" TRY → "₺1.200,00". */
export function formatPrice(price: CatalogPrice): string {
  let fmt = formatters.get(price.currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: price.currency });
    formatters.set(price.currency, fmt);
  }
  return fmt.format(Number(price.price_incl_tax));
}
