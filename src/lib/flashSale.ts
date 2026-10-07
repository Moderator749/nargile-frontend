// Flash-sale ("Fırsat Ürünleri") state for a variant at a given moment.

import type { CatalogPrice, CatalogVariant } from "@/types";

export type SaleState =
  | { kind: "none" }
  | { kind: "live"; price: CatalogPrice; endsAt: number }
  /** The sale ended while the page was open: checkout now charges the regular price. */
  | { kind: "ended" };

/** `now` is null before hydration: a live sale is then shown as live (server truth). */
export function saleState(variant: CatalogVariant | undefined, now: number | null): SaleState {
  const sale = variant?.flash_sale;
  if (!sale) return { kind: "none" };
  const endsAt = Date.parse(sale.ends_at);
  if (Number.isNaN(endsAt)) return { kind: "none" };
  if (now !== null && now >= endsAt) return { kind: "ended" };
  return { kind: "live", price: sale.price, endsAt };
}
