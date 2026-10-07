"use client";

import { useRef } from "react";

import { OrderSheetActions } from "@/components/admin/orders/OrderSheetActions";
import { OrderSheetHistory } from "@/components/admin/orders/OrderSheetHistory";
import { OrderSheetLines } from "@/components/admin/orders/OrderSheetLines";
import { SheetBlock, SheetField } from "@/components/admin/orders/SheetBlock";
import { addressLines, customerCode, orderHistory, sheetTotals, shippingStatus } from "@/components/admin/orders/sheetData";
import type { OrderNotice } from "@/components/admin/orders/useOrderActions";
import { formatDate, formatMoney } from "@/lib/format";
import type { AdminOrder } from "@/types";

const boxClass =
  "overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/15 dark:bg-zinc-900";

/** A total line; `strong` is the TOPLAM row. */
function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b border-slate-200 px-3 py-2 last:border-b-0 dark:border-white/10 ${
        strong ? "bg-slate-100 dark:bg-white/[0.06]" : ""
      }`}
    >
      <dt className={`text-[11px] font-bold uppercase tracking-wider ${strong ? "" : "text-slate-500 dark:text-zinc-400"}`}>
        {label}
      </dt>
      <dd className={`font-mono tabular-nums ${strong ? "text-base font-bold" : "text-sm font-semibold"}`}>{value}</dd>
    </div>
  );
}

/**
 * The order form of the Excel blueprint, rendered inline under its table row:
 * order + customer header, the two addresses, the note, the lines, the totals,
 * the command bar and the history.
 *
 * Everything comes from the row the admin already has, so expanding costs no
 * request. Fields the system does not record yet (bank approval code, order
 * note) keep their slot and print an em dash rather than being dropped.
 */
export function OrderSheet({
  order,
  busy,
  notice,
  onApprove,
  onCancel,
}: {
  order: AdminOrder;
  busy: boolean;
  notice?: OrderNotice;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const totals = sheetTotals(order);
  const shipping = shippingStatus(order);
  const delivery = order.shipping_address;
  // Retail buyers have no company profile, so they are invoiced where they are delivered.
  const billing = order.billing_address;
  const billingAddress = billing ?? delivery;

  /**
   * YAZDIR. The mark is set straight on the node, not through state: the print
   * stylesheet in globals.css shows the one marked sheet, and nothing in React
   * needs to re-render for a dialog that closes again a moment later.
   */
  function print() {
    const el = root.current;
    if (!el) return;
    el.setAttribute("data-print-sheet", "");
    const done = () => {
      el.removeAttribute("data-print-sheet");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  }

  return (
    <div
      ref={root}
      className="space-y-3 border-l-2 border-red-600 bg-slate-50 p-3 sm:p-4 dark:bg-zinc-950/40"
    >
      <h3 className="sr-only">{order.order_number} numaralı sipariş detayı</h3>

      <div className="grid gap-3 lg:grid-cols-2">
        <SheetBlock title="Sipariş Detayları">
          <dl>
            <SheetField label="Sipariş No" value={order.order_number} mono />
            <SheetField label="Sipariş Tarihi" value={formatDate(order.created_at)} />
            <SheetField label="Ödeme Şekli" value={order.payment_method === "BANK_TRANSFER" ? "Havale / EFT" : "Kredi kartı"} />
            {/* No payment gateway yet, so no approval code is recorded. */}
            <SheetField label="Banka Onay Kodu" value={null} mono />
          </dl>
        </SheetBlock>

        <SheetBlock title="Müşteri Bilgileri">
          <dl>
            <SheetField label="Müşteri No" value={customerCode(order)} mono />
            <SheetField label="Adı Soyadı" value={order.customer_name ?? delivery?.full_name ?? null} />
            <SheetField label="Mobil Tel" value={order.customer_phone ?? delivery?.phone ?? null} mono />
            <SheetField
              label="Mail"
              value={
                <a href={`mailto:${order.customer_email}`} className="break-all underline decoration-slate-300 underline-offset-2 hover:text-red-600 dark:decoration-white/20 dark:hover:text-red-400">
                  {order.customer_email}
                </a>
              }
            />
          </dl>
        </SheetBlock>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <SheetBlock title="Fatura Adresi">
          <dl>
            <SheetField label="Adı" value={order.company_title ?? billingAddress?.full_name ?? order.customer_name ?? null} />
            <SheetField label="Adres" value={addressLines(billingAddress ?? null)} />
            <SheetField label="Telefon" value={billingAddress?.phone ?? null} mono />
            <SheetField label="Mobil" value={order.customer_phone ?? null} mono />
          </dl>
          {!billing && (
            <p className="mt-auto border-t border-slate-200 px-3 py-1.5 text-[11px] text-slate-500 dark:border-white/10 dark:text-zinc-400">
              Ayrı fatura adresi yok · teslimat adresi ile aynı
            </p>
          )}
        </SheetBlock>

        <SheetBlock title="Teslimat Adresi">
          <dl>
            <SheetField label="Alıcı Adı" value={delivery?.full_name ?? null} />
            <SheetField label="Adres" value={addressLines(delivery)} />
            <SheetField label="Telefon" value={delivery?.phone ?? null} mono />
            <SheetField label="Mobil" value={order.customer_phone ?? null} mono />
          </dl>
        </SheetBlock>
      </div>

      <SheetBlock title="Sipariş Notu">
        {/* Checkout does not collect a note yet; the slot stays so the form matches. */}
        <p className="px-3 py-2 text-sm text-slate-500 dark:text-zinc-400">—</p>
      </SheetBlock>

      <div className={boxClass}>
        <OrderSheetLines items={order.items} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_22rem]">
        <div className={`${boxClass} flex flex-col justify-center gap-1 px-4 py-3`}>
          <p className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">{shipping.label}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">{shipping.detail}</p>
        </div>
        <dl className={boxClass}>
          <TotalRow label="Ara Toplam" value={formatMoney(totals.subtotal)} />
          <TotalRow label="KDV" value={formatMoney(totals.vat)} />
          {totals.shipping > 0 && <TotalRow label="Kargo" value={formatMoney(totals.shipping)} />}
          {totals.discount > 0 && <TotalRow label="İndirim" value={`−${formatMoney(totals.discount)}`} />}
          <TotalRow label="Toplam" value={formatMoney(totals.total)} strong />
        </dl>
      </div>

      <OrderSheetActions
        order={order}
        busy={busy}
        onApprove={onApprove}
        onCancel={onCancel}
        onPrint={print}
      />

      {notice && (
        <p
          role="status"
          className={`text-xs font-medium ${
            notice.kind === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {notice.text}
        </p>
      )}

      <SheetBlock title="Sipariş Geçmişi">
        <OrderSheetHistory rows={orderHistory(order)} />
      </SheetBlock>
    </div>
  );
}
