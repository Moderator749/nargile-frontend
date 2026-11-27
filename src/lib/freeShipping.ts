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
 * the cart without it. `line.shipsFree`: the product's "Kargo Bedava" switch
 * holds at that quantity, which makes any retail cart free; `rest.shipsFree`:
 * a line already in the cart does (lib/cartLine.lineShipsFree).
 */
export function shippingState(
  line: { amount: number; coal: boolean; shipsFree?: boolean },
  rest: { amount: number; coal: number; shipsFree?: boolean },
  params: Pick<StoreParameters, "free_shipping_threshold" | "coal_max_ratio">,
): ShippingState {
  const threshold = Number(params.free_shipping_threshold);
  const total = line.amount + rest.amount;
  const coalShare = total > 0 ? (rest.coal + (line.coal ? line.amount : 0)) / total : 0;
  const remaining = Math.max(0, Math.round((threshold - total) * 100) / 100);
  // The product's own "Kargo Bedava" (at its "Adet şartı"): the whole cart ships free.
  if (line.shipsFree) return { kind: "free_here" };
  if (rest.shipsFree) return { kind: "free_with_cart" };
  if (coalShare > Number(params.coal_max_ratio)) return { kind: "coal", remaining };
  if (total < threshold) return { kind: "to_free", remaining };
  return line.amount >= threshold ? { kind: "free_here" } : { kind: "free_with_cart" };
}
