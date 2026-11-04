/**
 * The retail price an admin list shows for a variant, as the storefront picks
 * it: its TRY row, else its USD, else its EUR one (the backend's
 * pricing_engine.CURRENCY_PREFERENCE) — a price entered in dollars is a price,
 * not a missing one. Free of React, for its tests.
 */
import type { CurrencyType, DecimalString } from "@/types";

export const CURRENCY_PREFERENCE: readonly CurrencyType[] = ["TRY", "USD", "EUR"];

interface PriceRow {
  segment_id: number;
  currency: CurrencyType;
  price_incl_tax: DecimalString;
}

/** The row that prices the variant for this segment, or null when it isn't sold to it. */
export function pickPriceRow<T extends PriceRow>(prices: readonly T[], segmentId: number | undefined): T | null {
  if (segmentId === undefined) return null;
  const rows = prices.filter((p) => p.segment_id === segmentId);
  for (const currency of CURRENCY_PREFERENCE) {
    const row = rows.find((p) => p.currency === currency);
    if (row) return row;
  }
  return null;
}

/**
 * What a foreign price comes to in lira at the day's TCMB rate (TRY per unit),
 * as the storefront charges it; null for a TRY price (nothing to convert) or
 * when the rate is unknown.
 */
export function inLira(row: PriceRow, rates: Partial<Record<CurrencyType, DecimalString>> | null | undefined): number | null {
  if (row.currency === "TRY") return null;
  const rate = Number(rates?.[row.currency]);
  if (!(rate > 0)) return null;
  return Math.round(Number(row.price_incl_tax) * rate * 100) / 100;
}
