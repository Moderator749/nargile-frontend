/**
 * Derivations for the admin order sheet (the Excel order form, on screen).
 *
 * Kept out of the components so the arithmetic is readable in one place: prices
 * are VAT-inclusive server-side, so the sheet's "ARA TOPLAM / KDV" split has to
 * be worked back out of the line totals.
 */

import { excludeVat, formatMoney } from "@/lib/format";
import { orderNetTotal } from "@/lib/ordersApi";
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
  const who = order.shipping_method === "COURIER_ISTANBUL" ? "kuryeye" : "kargo görevlisine";
  return {
    label: "ALICI ÖDER",
    detail: `Karşı ödemeli: gönderim ücreti teslimatta ${who} ödenir, sipariş toplamına dahil değildir`,
  };
}

/**
 * A Turkish mobile number as wa.me wants it: digits only, with the 90 country
 * code. Returns null when there is nothing dialable.
 */
export function whatsappNumber(order: AdminOrder): string | null {
  const raw = order.customer_phone ?? order.shipping_address?.phone ?? "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10) digits = `90${digits}`;
  return digits.length >= 12 ? digits : null;
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
  if (order.paid_at) rows.push({ at: order.paid_at, action: "SİPARİŞ ONAYLANDI", note: "Ödeme alındı, sipariş onaylandı" });
  if (order.status === "SHIPPED")
    rows.push({ at: null, action: "KARGOYA VERİLDİ", note: order.tracking_code ? `Takip no: ${order.tracking_code}` : "" });
  if (order.cancelled_at) rows.push({ at: order.cancelled_at, action: "SİPARİŞ İPTAL EDİLDİ", note: order.cancel_reason ?? "" });
  return rows;
}

/** One address block's lines, from a shipping or a billing address. */
export function addressLines(address: Partial<{ city: string; district: string; line: string }> | null): string | null {
  if (!address) return null;
  const place = [address.district, address.city].filter(Boolean).join(" / ");
  return [address.line, place].filter(Boolean).join(", ") || null;
}
