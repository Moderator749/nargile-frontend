// Carriers and tracking links, as the storefront and the admin panel show them.

import type { Carrier, Order } from "@/types";

/** Where a customer follows a Yurtiçi shipment by its gönderi kodu. */
export const YURTICI_TRACKING_URL = "https://www.yurticikargo.com/Tracking/Detail/";

export const yurticiTrackingUrl = (code: string) => `${YURTICI_TRACKING_URL}${encodeURIComponent(code.trim())}`;

export const CARRIER_LABELS: Record<Carrier, string> = {
  YURTICI: "Yurtiçi Kargo",
  OTHER: "Diğer kargo / ambar",
  OWN: "Kendi aracımız",
};

type Shipment = Pick<Order, "carrier" | "carrier_name" | "tracking_code" | "tracking_url" | "shipping_method">;

const viaYurtici = (order: Shipment) =>
  order.carrier ? order.carrier === "YURTICI" : order.shipping_method.startsWith("YURTICI");

/**
 * Who carries it, as a customer reads it: the carrier recorded at "Kargola",
 * or — for an order shipped before carriers were kept — Yurtiçi when that is
 * how it was to travel.
 */
export function carrierName(order: Shipment): string | null {
  if (order.carrier === "OTHER") return order.carrier_name || "Kargo";
  if (order.carrier === "OWN") return "Kendi aracımızla";
  return viaYurtici(order) ? "Yurtiçi Kargo" : null;
}

/**
 * The page the customer follows the parcel on: the one recorded with the
 * shipment, else Yurtiçi's own for a Yurtiçi tracking code; null when there is
 * nothing to follow (no code yet, the shop's own van, a carrier we have no
 * page for).
 */
export function trackingHref(order: Shipment): string | null {
  if (order.tracking_url) return order.tracking_url;
  if (!order.tracking_code) return null;
  return viaYurtici(order) ? yurticiTrackingUrl(order.tracking_code) : null;
}
