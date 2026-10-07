import { api } from "@/lib/api";
import type {
  B2BApplication,
  B2BApplicationInput,
  BankAccount,
  Cart,
  CartLineItem,
  CheckoutRequest,
  Order,
  PaymentMethod,
  ShippingAddress,
  ShippingMethod,
  Wallet,
} from "@/types";

export function buildCheckoutRequest(
  items: CartLineItem[],
  paymentMethod: PaymentMethod,
  pointsToRedeem: number,
  shippingMethod: ShippingMethod = "CARGO",
  shippingAddress: ShippingAddress | null = null,
  /** The "karşı ödemeli" box; ignored by price previews, required to order. */
  shippingConsent = false,
): CheckoutRequest {
  return {
    payment_method: paymentMethod,
    items: items.map(({ variant_id, quantity }) => ({ variant_id, quantity })),
    points_to_redeem: pointsToRedeem,
    shipping_method: shippingMethod,
    shipping_address: shippingAddress,
    shipping_consent: shippingConsent,
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

export async function fetchOrder(id: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`, { signal });
  return data;
}

export async function fetchBankAccounts(signal?: AbortSignal): Promise<BankAccount[]> {
  const { data } = await api.get<BankAccount[]>("/bank-accounts", { signal });
  return data;
}

export async function fetchMyWallet(signal?: AbortSignal): Promise<Wallet> {
  const { data } = await api.get<Wallet>("/me/wallet", { signal });
  return data;
}

/** The address of the customer's latest order, to prefill checkout (null if none). */
export async function fetchLastAddress(signal?: AbortSignal): Promise<ShippingAddress | null> {
  const { data } = await api.get<ShippingAddress | null>("/me/last-address", { signal });
  return data;
}

/** What the customer pays: subtotal + shipping − (volume + transfer discounts + points). */
export function orderNetTotal(order: Order): number {
  return Number(order.total_amount) + Number(order.shipping_cost) - Number(order.discount_amount);
}

export async function fetchMyB2BApplication(signal?: AbortSignal): Promise<B2BApplication | null> {
  const { data } = await api.get<B2BApplication | null>("/me/b2b-application", { signal });
  return data;
}

export async function applyForB2B(body: B2BApplicationInput): Promise<B2BApplication> {
  const { data } = await api.post<B2BApplication>("/me/b2b-application", body);
  return data;
}
