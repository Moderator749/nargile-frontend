import type { StoreParameters } from "@/types";

export type ShippingState =
  | { kind: "free_here" }
  | { kind: "free_with_cart" }
  | { kind: "to_free"; remaining: number }
  | { kind: "coal"; remaining: number };

/**
 * What the cart would ship at with this product in it, by checkout's rule for
 * a retail order (checkout_engine.shipping_quote): free from the threshold up,
 * unless coal ("Sepet Kuralı") is over `coal_max_ratio` of it — then free only
 * from the coal minimum, which only the cart's weights can tell, so nothing
 * is promised. `line` is this product at the quantity on the stepper; `rest`
 * the cart without it.
 */
export function shippingState(
  line: { amount: number; coal: boolean },
  rest: { amount: number; coal: number },
  params: Pick<StoreParameters, "free_shipping_threshold" | "coal_max_ratio">,
): ShippingState {
  const threshold = Number(params.free_shipping_threshold);
  const total = line.amount + rest.amount;
  const coalShare = total > 0 ? (rest.coal + (line.coal ? line.amount : 0)) / total : 0;
  const remaining = Math.max(0, Math.round((threshold - total) * 100) / 100);
  if (coalShare > Number(params.coal_max_ratio)) return { kind: "coal", remaining };
  if (total < threshold) return { kind: "to_free", remaining };
  return line.amount >= threshold ? { kind: "free_here" } : { kind: "free_with_cart" };
}
