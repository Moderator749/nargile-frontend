import type { StoreParameters } from "@/types";

/**
 * A visitor's cart summed up before they sign in, by the same rules checkout
 * applies to a bireysel order (`rate_for` and the shipping rule in
 * app/services): the ciro discount of the highest tier the subtotal has
 * reached, and free shipping from the threshold up. An estimate — the server
 * prices the order, and a firm's account gets its own list's prices instead.
 */
export interface CartEstimate {
  subtotal: number;
  /** The ciro discount's rate (0.05) and amount; 0 below the first tier. */
  volumeRate: number;
  volumeDiscount: number;
  total: number;
  /** The next tier the cart has not reached, and how far off it is. */
  nextTier: { threshold: number; rate: number; remaining: number } | null;
  freeShipping: boolean;
  shippingThreshold: number;
  /** What is left to add for free shipping; 0 once it is. */
  toFreeShipping: number;
}

const cents = (n: number) => Math.round(n * 100) / 100;

export function estimateCart(
  subtotal: number,
  params: Pick<StoreParameters, "volume_tiers" | "free_shipping_threshold">,
): CartEstimate {
  const tiers = params.volume_tiers
    .map((t) => ({ threshold: Number(t.threshold), rate: Number(t.rate) }))
    .filter((t) => t.rate > 0)
    .sort((a, b) => a.threshold - b.threshold);
  const reached = tiers.filter((t) => subtotal >= t.threshold);
  const volumeRate = reached.length > 0 ? reached[reached.length - 1].rate : 0;
  const volumeDiscount = cents(subtotal * volumeRate);
  const next = tiers.find((t) => subtotal < t.threshold) ?? null;
  const shippingThreshold = Number(params.free_shipping_threshold);
  const freeShipping = subtotal >= shippingThreshold;
  return {
    subtotal,
    volumeRate,
    volumeDiscount,
    total: cents(subtotal - volumeDiscount),
    nextTier: next ? { ...next, remaining: cents(next.threshold - subtotal) } : null,
    freeShipping,
    shippingThreshold,
    toFreeShipping: freeShipping ? 0 : cents(shippingThreshold - subtotal),
  };
}
