import type { CartLineItem, Product } from "@/types";

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

export type FreeShippingFlags = Pick<
  Product,
  "is_free_shipping" | "free_shipping_min_quantity" | "opp_is_free_shipping" | "opp_free_shipping_min_quantity"
>;

/**
 * From how many units of this product a retail cart ships free by its own
 * "Kargo Bedava" switch (the Fırsat block's while the deal price is live), or
 * null when the switch is off. Mirrors checkout_engine.ResolvedCartItem.ships_free.
 */
export function freeShippingFrom(product: FreeShippingFlags, dealLive: boolean): number | null {
  const on = dealLive ? product.opp_is_free_shipping : product.is_free_shipping;
  const minimum = dealLive ? product.opp_free_shipping_min_quantity : product.free_shipping_min_quantity;
  return on ? Math.max(1, minimum ?? 1) : null;
}

/**
 * Whether a card or a product page says "Kargo Bedava": only for a product the
 * admin ships free on purpose — its "Kargo Bedava" switch (the Fırsat block's
 * while the deal price is live), with one unit enough to meet its "Adet şartı".
 * A price over the free-shipping threshold does not earn the badge: such
 * carts ship free anyway, and a grid of sets all saying so is clutter
 * (user's decision, 2026-11-27).
 *
 * Retail promises only (`perks`: a visitor or a Perakende account); a
 * Kafe/Toptan/Bayi price never includes carriage.
 */
export function showsFreeShipping({
  product,
  dealLive,
  perks,
}: {
  product: FreeShippingFlags;
  dealLive: boolean;
  perks: boolean;
}): boolean {
  return perks && freeShippingFrom(product, dealLive) === 1;
}

/** A cart line meets its product's "Kargo Bedava" switch: the whole retail cart ships free. */
export function lineShipsFree(line: Pick<CartLineItem, "quantity" | "ships_free_from">): boolean {
  return line.ships_free_from != null && line.quantity >= line.ships_free_from;
}
