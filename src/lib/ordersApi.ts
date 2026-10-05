import { api } from "@/lib/api";
import type { Cart, CartLineItem, CheckoutRequest, Order, PaymentMethod } from "@/types";

export function buildCheckoutRequest(
  items: CartLineItem[],
  paymentMethod: PaymentMethod,
  pointsToRedeem: number,
): CheckoutRequest {
  return {
    payment_method: paymentMethod,
    items: items.map(({ variant_id, quantity }) => ({ variant_id, quantity })),
    points_to_redeem: pointsToRedeem,
  };
}

/** Server-side price preview; nothing is saved. */
export async function calculateCart(payload: CheckoutRequest, signal?: AbortSignal): Promise<Cart> {
  const { data } = await api.post<Cart>("/orders/calculate-cart", payload, { signal });
  return data;
}

export async function checkout(payload: CheckoutRequest): Promise<Order> {
  const { data } = await api.post<Order>("/orders/checkout", payload);
  return data;
}

export async function fetchMyOrders(signal?: AbortSignal): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/orders/", { signal });
  return data;
}

/** What the customer pays: subtotal + shipping − (bank discount + ParaPuan). */
export function orderNetTotal(order: Order): number {
  return Number(order.total_amount) + Number(order.shipping_cost) - Number(order.discount_amount);
}
