import type { Product } from "@/types";

/**
 * Where the photo badges sit, in logical corners so Arabic mirrors them: the
 * SultanPuan mark takes the top start (top left; top right in Arabic), the
 * "Kargo Bedava" pill the top end, under the deal / sold-out pill if any. The
 * two never share a corner, so they cannot overlap on any card width.
 */
export const BADGE_CORNERS = { sultanPuan: "start", freeShipping: "end" } as const;

/** The badge's words, read by the card through catalogMessages.card.freeShipping. */
export const FREE_SHIPPING_LABEL: Readonly<Record<"tr" | "en" | "ar", string>> = {
  tr: "Kargo Bedava",
  en: "Free Shipping",
  ar: "شحن مجاني",
};

type Flags = Pick<
  Product,
  | "is_free_shipping"
  | "free_shipping_min_quantity"
  | "opp_is_free_shipping"
  | "opp_free_shipping_min_quantity"
  | "is_cart_rule_applied"
>;

/**
 * Whether a card or a product page may say "Kargo Bedava": only when checkout
 * would ship this product, bought on its own, free (checkout_engine.
 * quote_shipping) — so it never promises carriage the order will not cover.
 *
 * - Retail promises only (`perks`: a visitor or a Perakende account); a
 *   Kafe/Toptan/Bayi price never includes carriage.
 * - The product's own "Kargo Bedava" switch — the Fırsat block's while the deal
 *   price is live — ships the whole cart free at any total, but only from its
 *   "Adet şartı": one unit has to be enough, or the badge would overpromise.
 * - Otherwise the price alone reaches the free-shipping threshold, and the
 *   product is not coal ("Sepet Kuralı"), whose cart needs a minimum weight.
 */
export function showsFreeShipping({
  product,
  priceInclTax,
  dealLive,
  threshold,
  perks,
}: {
  product: Flags;
  priceInclTax: string | number | null | undefined;
  dealLive: boolean;
  threshold: string | number;
  perks: boolean;
}): boolean {
  if (!perks) return false;
  const on = dealLive ? product.opp_is_free_shipping : product.is_free_shipping;
  const minimum = dealLive ? product.opp_free_shipping_min_quantity : product.free_shipping_min_quantity;
  if (on && (minimum ?? 1) <= 1) return true;
  if (priceInclTax === null || priceInclTax === undefined || priceInclTax === "") return false;
  if (product.is_cart_rule_applied !== false) return false;
  const price = Number(priceInclTax);
  const limit = Number(threshold);
  return Number.isFinite(price) && Number.isFinite(limit) && price >= limit;
}
