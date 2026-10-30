"use client";

import Link from "next/link";
import { ExternalLink, Printer, RefreshCw, Store, Truck, Undo2 } from "lucide-react";

import { labelHref } from "@/components/admin/orders/ShipDialog";
import { SheetBlock, SheetField } from "@/components/admin/orders/SheetBlock";
import { canShipOrder, canWithdrawShipment } from "@/components/admin/orders/useOrderActions";
import { formatDate } from "@/lib/format";
import { carrierName, trackingHref } from "@/lib/tracking";
import type { AdminOrder } from "@/types";

const button =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold uppercase tracking-wider transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50";
const neutral =
  "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/15 dark:hover:bg-white/5";

/**
 * KARGO on the order sheet: the shipment once it has left — carrier, tracking
 * link, Yurtiçi's last word on it, when it was delivered — and what can be done
 * with it: "Kargola" or "Mağazadan Teslim" while the order waits, the label, a
 * fresh status, or withdrawing a web-service registration the branch has not
 * collected yet. Nothing for an order that is not paid yet, or that was
 * cancelled before it left.
 */
export function OrderShipment({
  order,
  busy,
  onShip,
  onDeliverInStore,
  onRefresh,
  onWithdraw,
}: {
  order: AdminOrder;
  busy: boolean;
  onShip?: () => void;
  onDeliverInStore?: () => void;
  onRefresh?: () => void;
  onWithdraw?: () => void;
}) {
  // Gone out: shipped, delivered, or since returned.
  const shipped = order.status === "SHIPPED" || order.status === "DELIVERED" || order.status === "RETURNED";
  if (!shipped && !canShipOrder(order.status)) return null;
  const href = trackingHref(order);
  const inStore = order.carrier === "STORE";

  return (
    // Waiting to be shipped, the block has nothing for paper but its status
    // line, so the printed sheet leaves it out whole.
    <SheetBlock title="Kargo" print={shipped}>
      {shipped && inStore ? (
        <dl>
          <SheetField label="Teslim" value="Mağazada müşteriye teslim edildi" />
          {order.delivered_at && <SheetField label="Teslim Tarihi" value={formatDate(order.delivered_at)} />}
        </dl>
      ) : shipped ? (
        <dl>
          <SheetField label="Firma" value={carrierName(order) ?? "—"} />
          <SheetField
            label="Takip No"
            mono
            value={
              order.tracking_code ? (
                href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-red-700 hover:underline dark:text-red-400">
                    {order.tracking_code} <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : (
                  order.tracking_code
                )
              ) : order.cargo_key ? (
                "Şube etiketi okuttuğunda gelecek"
              ) : (
                "—"
              )
            }
          />
          {order.cargo_key && <SheetField label="Kargo Anahtarı" value={order.cargo_key} mono />}
          {order.carrier_status_text && (
            <SheetField
              label="Durum"
              print={false}
              value={`${order.carrier_status_text}${order.carrier_synced_at ? ` · ${formatDate(order.carrier_synced_at)}` : ""}`}
            />
          )}
          {order.shipped_at && <SheetField label="Kargolandı" value={formatDate(order.shipped_at)} />}
          {order.delivered_at && <SheetField label="Teslim Edildi" value={formatDate(order.delivered_at)} />}
        </dl>
      ) : (
        <p className="px-3 py-2 text-sm text-slate-600 dark:text-zinc-400">Ödeme alındı; kargoya verilmeyi bekliyor.</p>
      )}

      {/* Handed over at the shop: nothing left to do with a shipment. */}
      {!(shipped && inStore) && (
        <div data-print-hide className="flex flex-wrap gap-2 border-t border-slate-200 px-3 py-2.5 dark:border-white/10">
          {!shipped && onShip && (
            <button type="button" onClick={onShip} disabled={busy} className={`${button} bg-red-600 text-white shadow-sm hover:bg-red-500`}>
              <Truck className="h-4 w-4" aria-hidden /> Kargola
            </button>
          )}
          {!shipped && onDeliverInStore && (
            <button
              type="button"
              onClick={onDeliverInStore}
              disabled={busy}
              title="Müşteri mağazadan teslim aldı: kargo kaydı açmadan teslim edildi olarak işaretle"
              className={`${button} ${neutral}`}
            >
              <Store className="h-4 w-4" aria-hidden /> Mağazadan Teslim
            </button>
          )}
          <Link href={labelHref(order)} target="_blank" className={`${button} ${neutral}`}>
            <Printer className="h-4 w-4" aria-hidden /> Etiket Yazdır
          </Link>
          {order.status === "SHIPPED" && order.cargo_key && onRefresh && (
            <button type="button" onClick={onRefresh} disabled={busy} className={`${button} ${neutral}`}>
              <RefreshCw className="h-4 w-4" aria-hidden /> Durumu Yenile
            </button>
          )}
          {canWithdrawShipment(order) && onWithdraw && (
            <button type="button" onClick={onWithdraw} disabled={busy} className={`${button} ${neutral}`}>
              <Undo2 className="h-4 w-4" aria-hidden /> Kaydı Geri Al
            </button>
          )}
        </div>
      )}
    </SheetBlock>
  );
}
