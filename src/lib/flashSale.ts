// "Fırsat Ürünleri" state for a product/variant at a given moment.

import type { CatalogPrice, CatalogProduct, CatalogVariant } from "@/types";

export type SaleState =
  /** Claimable. `endsAt` is null for an offer with no deadline: no countdown. */
  | { kind: "live"; price: CatalogPrice; endsAt: number | null }
  /**
   * "Fırsat Kaçtı": the product is still on the Fırsat list, but the deal is
   * over — its deadline passed (possibly while this page was open) or its deal
   * stock ran out. Checkout charges the regular price.
   */
  | { kind: "missed" }
  | { kind: "none" };

/**
 * `now` is null before hydration: a live sale is then shown as live (server
 * truth), so the server and the first client render agree.
 */
export function saleState(
  product: Pick<CatalogProduct, "is_opportunity">,
  variant: CatalogVariant | undefined,
  now: number | null,
): SaleState {
  const sale = variant?.flash_sale;
  // No claimable price, but still an opportunity product: the deal was missed.
  if (!sale) return product.is_opportunity ? { kind: "missed" } : { kind: "none" };
  if (!sale.ends_at) return { kind: "live", price: sale.price, endsAt: null };
  const endsAt = Date.parse(sale.ends_at);
  if (Number.isNaN(endsAt)) return { kind: "live", price: sale.price, endsAt: null };
  if (now !== null && now >= endsAt) return { kind: "missed" };
  return { kind: "live", price: sale.price, endsAt };
}
