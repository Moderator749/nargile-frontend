/**
 * GA4 e-commerce events (view_item, add_to_cart, remove_from_cart, view_cart,
 * begin_checkout, add_shipping_info, add_payment_info, purchase, search).
 *
 * Sent through the Google tag (components/analytics/GoogleAnalytics), which
 * only production loads and which Consent Mode governs: before "Tümünü Kabul
 * Et" Google gets them without cookies. An event fired before the tag has
 * started (a product page's view_item, right after hydration) waits in
 * `window.__gaq`, which the tag's init script sends on after its `config`;
 * where the tag never loads (previews, `next dev`) nothing is sent.
 *
 * Prices are what the visitor pays, VAT included, in TRY.
 */

import type { CartLineItem, CatalogPrice, CatalogProduct, CatalogVariant, Order } from "@/types";

const CURRENCY = "TRY";
/** Kept while the tag has not started; a page without the tag never grows past this. */
const QUEUE_MAX = 50;

type GaArgs = ["event", string, Record<string, unknown>];

declare global {
  interface Window {
    __gaq?: GaArgs[];
  }
}

export interface GaItem {
  item_id: string;
  item_name?: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
}

export function track(name: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (window.gtag) {
    window.gtag("event", name, params);
    return;
  }
  const queue = (window.__gaq ??= []);
  if (queue.length < QUEUE_MAX) queue.push(["event", name, params]);
}

/** Drops empty fields: GA shows "(not set)" for an absent one, but an empty string as a value. */
function item(fields: GaItem): GaItem {
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined && v !== null && v !== "" && !Number.isNaN(v)),
  ) as unknown as GaItem;
}

const money = (n: number) => Math.round(n * 100) / 100;

function itemsValue(items: GaItem[]): number {
  return money(items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0));
}

/** A product page's colour, priced as the page shows it. */
export function catalogItem(
  product: CatalogProduct,
  variant: CatalogVariant,
  price: CatalogPrice,
  category?: string | null,
): GaItem {
  return item({
    item_id: variant.sku || variant.id,
    item_name: product.name,
    item_brand: product.brand ?? undefined,
    item_category: category ?? undefined,
    item_variant: variant.color_name ?? undefined,
    price: money(Number(price.price_incl_tax)),
  });
}

/** A cart line, at `quantity` (the line's own by default): its segment or sale price when it has one. */
export function cartItem(line: CartLineItem, quantity = line.quantity): GaItem {
  return item({
    item_id: line.sku || line.variant_id,
    item_name: line.product_name,
    item_brand: line.brand ?? undefined,
    item_category: line.category ?? undefined,
    item_variant: line.color_name ?? undefined,
    price: money(Number(line.segment_price ?? line.price)),
    quantity,
  });
}

/** add_to_cart / remove_from_cart for these items. */
export function trackCartChange(event: "add_to_cart" | "remove_from_cart", items: GaItem[]): void {
  if (items.length === 0) return;
  track(event, { currency: CURRENCY, value: itemsValue(items), items });
}

/** view_cart, begin_checkout, add_shipping_info, add_payment_info: the cart as it stands, plus `extra`. */
export function trackCart(event: string, lines: CartLineItem[], extra: Record<string, unknown> = {}): void {
  if (lines.length === 0) return;
  const items = lines.map((line) => cartItem(line));
  track(event, { currency: CURRENCY, value: itemsValue(items), items, ...extra });
}

export function trackViewItem(gaItem: GaItem): void {
  track("view_item", { currency: CURRENCY, value: gaItem.price ?? 0, items: [{ ...gaItem, quantity: 1 }] });
}

// ---------------------------------------------------------------- lists

/** A product list as GA reports it: a stable id and a Turkish name, whatever the page's language. */
export interface GaList {
  id: string;
  name: string;
}

/** A listed product, at the price its card shows (null while unknown). */
export function listItem(
  product: CatalogProduct,
  variant: CatalogVariant | null,
  price: CatalogPrice | null,
  category?: string | null,
): GaItem {
  return item({
    item_id: variant?.sku || variant?.id || product.base_code || product.id,
    item_name: product.name,
    item_brand: product.brand ?? undefined,
    item_category: category ?? undefined,
    price: price ? money(Number(price.price_incl_tax)) : undefined,
  });
}

/** Seen cards waiting to go out, per list; one view_item_list per list per flush. */
const pending = new Map<string, { list: GaList; items: (GaItem & { index: number })[] }>();
/** What this page has already reported: a card scrolled past twice counts once. */
const seen = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
/** GA takes up to 200 items an event; a screenful is far fewer. */
const LIST_CHUNK = 50;

function flushImpressions(): void {
  flushTimer = null;
  for (const { list, items } of pending.values()) {
    for (let i = 0; i < items.length; i += LIST_CHUNK) {
      track("view_item_list", {
        item_list_id: list.id,
        item_list_name: list.name,
        items: items.slice(i, i + LIST_CHUNK).map((it) => ({ ...it, item_list_id: list.id, item_list_name: list.name })),
      });
    }
  }
  pending.clear();
}

/**
 * view_item_list for a card that came into sight (ProductCard): the cards seen
 * within a second go out together, one event per list, each once per page —
 * so a list's impressions are cards a visitor actually saw, not everything a
 * grid loaded.
 */
export function trackListImpression(list: GaList, gaItem: GaItem, index: number): void {
  if (typeof window === "undefined") return;
  const key = `${location.pathname}|${list.id}|${gaItem.item_id}`;
  if (seen.has(key)) return;
  seen.add(key);
  const entry = pending.get(list.id) ?? { list, items: [] };
  entry.items.push({ ...gaItem, index });
  pending.set(list.id, entry);
  flushTimer ??= setTimeout(flushImpressions, 1000);
}

/** select_item: a card opened from a list. What was waiting to go out goes first, so GA sees the view before the click. */
export function trackSelectItem(list: GaList, gaItem: GaItem, index: number): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushImpressions();
  }
  track("select_item", {
    item_list_id: list.id,
    item_list_name: list.name,
    items: [{ ...gaItem, index, item_list_id: list.id, item_list_name: list.name }],
  });
}

// ---------------------------------------------------------------- purchase

const orderItemsKey = (orderId: string) => `ga_order_items_${orderId}`;
const purchaseSentKey = (orderId: string) => `ga_purchase_${orderId}`;

/**
 * The cart's lines as the order was placed, for its purchase event: an
 * order's own items carry no names, and the cart is emptied on the way to the
 * confirmation. Same tab (sessionStorage): PayTR returns the customer there.
 */
export function rememberOrderItems(orderId: string, lines: CartLineItem[]): void {
  try {
    sessionStorage.setItem(orderItemsKey(orderId), JSON.stringify(lines.map((line) => cartItem(line))));
  } catch {
    // Storage off: the purchase goes out with the order's own (unnamed) items.
  }
}

function rememberedItems(orderId: string): GaItem[] | null {
  try {
    const stored = sessionStorage.getItem(orderItemsKey(orderId));
    return stored ? (JSON.parse(stored) as GaItem[]) : null;
  } catch {
    return null;
  }
}

const PAID = new Set(["APPROVED", "SHIPPED", "DELIVERED"]);

/**
 * purchase, once per order in this browser (a reload, or opening it again
 * from the order list, sends nothing more):
 * - a card order once it is paid, on the way back from PayTR;
 * - a havale/EFT order as it is placed (this tab's checkout remembered it),
 *   with payment_type "BANK_TRANSFER" — its money arrives later, if at all;
 * - never a quote request (export), which charges nothing.
 */
export function trackPurchase(order: Order, backFromPaytr: boolean): void {
  if (typeof window === "undefined" || order.payment_method === "QUOTE") return;
  const remembered = rememberedItems(order.id);
  const card = order.payment_method === "CREDIT_CARD";
  const due = card
    ? backFromPaytr && PAID.has(order.status)
    : order.payment_method === "BANK_TRANSFER" && remembered !== null && order.status !== "CANCELLED";
  if (!due) return;
  try {
    if (localStorage.getItem(purchaseSentKey(order.id))) return;
    localStorage.setItem(purchaseSentKey(order.id), "1");
  } catch {
    // Without storage a reload could send it again; GA dedupes on transaction_id within a session.
  }
  const items =
    remembered ??
    order.items.map((i) => item({ item_id: i.variant_id, price: money(Number(i.unit_price)), quantity: i.quantity }));
  track("purchase", {
    transaction_id: order.order_number,
    currency: CURRENCY,
    value: money(Number(order.total_amount) + Number(order.shipping_cost) - Number(order.discount_amount)),
    shipping: money(Number(order.shipping_cost)),
    payment_type: order.payment_method,
    items,
  });
  try {
    sessionStorage.removeItem(orderItemsKey(order.id));
  } catch {
    // Nothing to tidy.
  }
}
