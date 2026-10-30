/**
 * Derivations for the admin order sheet (the Excel order form, on screen).
 *
 * Kept out of the components so the arithmetic is readable in one place: prices
 * are VAT-inclusive server-side, so the sheet's "ARA TOPLAM / KDV" split has to
 * be worked back out of the line totals.
 */

import { excludeVat, formatMoney } from "@/lib/format";
import { orderNetTotal } from "@/lib/ordersApi";
import { carrierName } from "@/lib/tracking";
import { whatsappNumber as cleanNumber } from "@/lib/whatsapp";
import type { AdminOrder } from "@/types";

/** The Excel form's "Müşteri No": a short, quotable code cut from the user id. */
export function customerCode(order: AdminOrder): string {
  return order.user_id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export interface SheetTotals {
  /** Goods total without VAT. */
  subtotal: number;
  vat: number;
  shipping: number;
  discount: number;
  /** What the customer pays. */
  total: number;
}

/**
 * `unit_price` already includes VAT, so the net total is the sum of each line
 * divided by its own rate (rates differ per product). A line whose price row is
 * gone counts as VAT-free rather than silently taxed at a guessed rate.
 */
export function sheetTotals(order: AdminOrder): SheetTotals {
  let gross = 0;
  let net = 0;
  for (const item of order.items) {
    gross += Number(item.line_total);
    net += Number(excludeVat(item.line_total, item.vat_rate ?? "0"));
  }
  return {
    subtotal: net,
    vat: gross - net,
    shipping: Number(order.shipping_cost),
    discount: Number(order.discount_amount),
    total: orderNetTotal(order),
  };
}

/**
 * The form's shipping box: who pays the carriage. The shop never adds carriage to
 * an order, so this reads `shipping_payer`, not the (always zero) shipping_cost.
 */
export function shippingStatus(order: AdminOrder): { label: string; detail: string } {
  // Orders from before the karşı ödemeli rule still carry the fee they were charged.
  if (Number(order.shipping_cost) > 0)
    return {
      label: "KARGO ÜCRETİ TAHSİL EDİLDİ",
      detail: `${formatMoney(order.shipping_cost)} sipariş toplamına eklenmiştir (eski tarife)`,
    };
  if (order.shipping_payer === "SHOP") return { label: "ÜCRETSİZ KARGO", detail: "Gönderim ücreti firmaya aittir" };
  const who =
    order.shipping_method === "NAKLIYE_AMBARI" ? "ambar görevlisine" : "kargo görevlisine";
  return {
    label: "ALICI ÖDER",
    detail: `Karşı ödemeli: gönderim ücreti teslimatta ${who} ödenir, sipariş toplamına dahil değildir`,
  };
}

/**
 * The order's number for wa.me: the customer's own, or the one on the delivery
 * address. Null when there is nothing dialable — see `lib/whatsapp`.
 */
export function whatsappNumber(order: AdminOrder): string | null {
  return cleanNumber(order.customer_phone ?? order.shipping_address?.phone);
}

export interface HistoryRow {
  /** Null for a state the model keeps without a timestamp (e.g. shipping). */
  at: string | null;
  action: string;
  note: string;
}

/** "SİPARİŞ GEÇMİŞİ": the lifecycle timestamps the order carries, oldest first. */
export function orderHistory(order: AdminOrder): HistoryRow[] {
  const rows: HistoryRow[] = [
    {
      at: order.created_at,
      action: "SİPARİŞ OLUŞTURULDU",
      note: order.payment_method === "BANK_TRANSFER" ? "Havale / EFT ile sipariş alındı" : "Kredi kartı ile sipariş alındı",
    },
  ];
  if (order.cancelled_at) rows.push({ at: order.cancelled_at, action: "SİPARİŞ İPTAL EDİLDİ", note: order.cancel_reason ?? "" });
  // Before the payment: recovered and approved in one step, it was recovered first.
  if (order.recovered_at) rows.push({ at: order.recovered_at, action: "SİPARİŞ KURTARILDI", note: "İptal geri alındı" });
  if (order.paid_at) rows.push({ at: order.paid_at, action: "SİPARİŞ ONAYLANDI", note: "Ödeme alındı, sipariş onaylandı" });
  if (order.store_approved_at)
    rows.push({
      at: order.store_approved_at,
      action: "MAĞAZA ONAYLADI",
      note: `Stok kontrol edildi, hazırlanabilir${order.store_approved_by_name ? ` · ${order.store_approved_by_name}` : ""}`,
    });
  const left = order.status === "SHIPPED" || order.status === "DELIVERED" || order.status === "RETURNED";
  if (left && order.carrier !== "STORE" && (order.shipped_at || order.status === "SHIPPED"))
    rows.push({
      at: order.shipped_at ?? null,
      action: "KARGOYA VERİLDİ",
      note: [carrierName(order), order.tracking_code ? `Takip no: ${order.tracking_code}` : null].filter(Boolean).join(" · "),
    });
  if (order.delivered_at)
    rows.push({
      at: order.delivered_at,
      action: "TESLİM EDİLDİ",
      note: order.carrier === "STORE" ? "Mağazada müşteriye teslim edildi" : (carrierName(order) ?? "Kargo teslim etti"),
    });
  if (order.returned_at) rows.push({ at: order.returned_at, action: "İADE EDİLDİ", note: order.return_reason ?? "" });
  // Oldest first, as they happened: a recovered order was cancelled before it
  // was paid. A shipment from before shipped_at was kept sits after the payment.
  const when = (row: HistoryRow) => row.at ?? order.paid_at ?? order.created_at;
  return rows.sort((a, b) => when(a).localeCompare(when(b)));
}

/**
 * One address block's lines, from a shipping or a billing address. An address
 * abroad has no ilçe and often a postal code instead, so both are optional.
 */
export function addressLines(
  address: Partial<{ city: string; district: string | null; postal_code: string | null; line: string }> | null,
): string | null {
  if (!address) return null;
  const place = [address.district, address.city].filter(Boolean).join(" / ");
  return [address.line, address.postal_code, place].filter(Boolean).join(", ") || null;
}
