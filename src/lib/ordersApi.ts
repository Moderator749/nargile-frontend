import { api } from "@/lib/api";
import type {
  B2BApplication,
  B2BApplicationInput,
  BankAccount,
  Cart,
  CartLineItem,
  CheckoutRequest,
  CorporateInvoiceDetails,
  InvoiceAddress,
  Order,
  PaymentMethod,
  SavedAddress,
  ShippingAddress,
  ShippingMethod,
  TransportMode,
  Wallet,
} from "@/types";

export function buildCheckoutRequest(
  items: CartLineItem[],
  paymentMethod: PaymentMethod,
  pointsToRedeem: number,
  shippingMethod: ShippingMethod = "YURTICI_DOOR",
  shippingAddress: ShippingAddress | null = null,
  options: {
    /** The "karşı ödemeli" box; ignored by price previews, required to order. */
    shippingConsent?: boolean;
    /** "Başka biri teslim alacak": both or neither. */
    receiverName?: string | null;
    receiverPhone?: string | null;
    /** The buyer's own Yurtiçi agreement, and the ambar they named; each method
        keeps only its own, server-side as well. */
    shippingContractNo?: string | null;
    freightCompanyName?: string | null;
    freightPhone?: string | null;
    /** "Şubeme istiyorum": the branch a firm's order goes to. Naming it is
        what lets the address be somewhere other than the registered one. */
    shippingBranchName?: string | null;
    /** Who the invoice is made out to, and where that firm is registered;
        see `cart/invoiceDraft`. */
    invoice?: {
      invoice_to_company: boolean;
      invoice_company_title?: string;
      invoice_tax_office?: string;
      invoice_trade_name?: string | null;
      invoice_tax_number?: string;
      invoice_address?: InvoiceAddress;
    };
    /** "Kart bilgilerimi … güvenle kaydet": passed on, never held here. */
    saveCard?: boolean;
    /** "Sipariş Notu": free text for the shop, or nothing at all. */
    orderNote?: string | null;
    /** Road, air or sea: an export request only. The server refuses it from
        anyone else, so it is sent as null rather than omitted by accident. */
    transportMode?: TransportMode | null;
    /** The two agreements; an order without both is refused by the server. */
    agreements?: { distanceSales: boolean; terms: boolean };
  } = {},
): CheckoutRequest {
  return {
    payment_method: paymentMethod,
    items: items.map(({ variant_id, quantity }) => ({ variant_id, quantity })),
    points_to_redeem: pointsToRedeem,
    shipping_method: shippingMethod,
    shipping_address: shippingAddress,
    shipping_consent: options.shippingConsent ?? false,
    receiver_name: options.receiverName ?? null,
    receiver_phone: options.receiverPhone ?? null,
    shipping_contract_no: options.shippingContractNo ?? null,
    freight_company_name: options.freightCompanyName ?? null,
    freight_phone: options.freightPhone ?? null,
    shipping_branch_name: options.shippingBranchName ?? null,
    ...(options.invoice ?? { invoice_to_company: false }),
    save_card: options.saveCard ?? false,
    order_note: options.orderNote?.trim() || null,
    transport_mode: options.transportMode ?? null,
    distance_sales_accepted: options.agreements?.distanceSales ?? false,
    terms_accepted: options.agreements?.terms ?? false,
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

/**
 * The firm the customer keeps on file to be invoiced instead, or null when
 * there is none. What the cart's invoice section starts from.
 */
export async function fetchCorporateInvoice(
  signal?: AbortSignal,
): Promise<CorporateInvoiceDetails | null> {
  const { data } = await api.get<CorporateInvoiceDetails | null>("/me/corporate-invoice", { signal });
  return data;
}

/** Keeps it on file, so the next order is already filled in. */
export async function saveCorporateInvoice(
  body: CorporateInvoiceDetails,
): Promise<CorporateInvoiceDetails> {
  const { data } = await api.put<CorporateInvoiceDetails>("/me/corporate-invoice", body);
  return data;
}

/** Corrects the customer's own invoice address on their account. */
export async function saveBillingAddress(body: InvoiceAddress): Promise<InvoiceAddress> {
  const { data } = await api.put<InvoiceAddress>("/me/billing-address", body);
  return data;
}

/**
 * The addresses sign-up collected, to pick from at checkout. Shipping to one
 * never changes it: the order keeps its own copy.
 */
export async function fetchSavedAddresses(signal?: AbortSignal): Promise<SavedAddress[]> {
  const { data } = await api.get<SavedAddress[]>("/me/addresses", { signal });
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

/** Ticari elektronik ileti onayı: campaign e-mail / SMS. */
export interface CommunicationPreferences {
  email: boolean;
  sms: boolean;
}

export async function fetchCommunicationPreferences(signal?: AbortSignal): Promise<CommunicationPreferences> {
  const { data } = await api.get<CommunicationPreferences>("/me/communication-preferences", { signal });
  return data;
}

export async function updateCommunicationPreferences(body: CommunicationPreferences): Promise<CommunicationPreferences> {
  const { data } = await api.put<CommunicationPreferences>("/me/communication-preferences", body);
  return data;
}
