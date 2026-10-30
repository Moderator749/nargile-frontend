"use client";

import { PackageCheck, Undo2 } from "lucide-react";

import { storeApprovalOpen, type OrderActions } from "@/components/admin/orders/useOrderActions";
import { formatDate } from "@/lib/format";
import type { AdminOrder } from "@/types";

/**
 * "MAĞAZA ONAYI": the shop's own word that the stock is checked and the order
 * may be packed — a decision of its own, beside the payment status (which the
 * ÖDEME column carries and this never changes). A button until it is given;
 * then who gave it and when, with a way back — both only while the order is
 * still in the shop.
 */
export function StoreApproval({ order, actions }: { order: AdminOrder; actions: OrderActions }) {
  const busy = actions.busy(order.id);
  const approved = !!order.store_approved_at;

  if (approved) {
    return (
      <div className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
        <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide">
          <PackageCheck className="h-3.5 w-3.5 shrink-0" aria-hidden /> Onaylandı
        </p>
        <p className="mt-0.5 truncate text-[11px] leading-4" title={`${order.store_approved_by_name ?? ""} · ${formatDate(order.store_approved_at!)}`}>
          {order.store_approved_by_name && <>{order.store_approved_by_name} · </>}
          {formatDate(order.store_approved_at!)}
        </p>
        {storeApprovalOpen(order.status) && (
          <button
            type="button"
            onClick={() => void actions.storeApprove(order, false)}
            disabled={busy}
            className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 underline-offset-2 hover:underline disabled:opacity-50 dark:text-emerald-300"
          >
            <Undo2 className="h-3 w-3" aria-hidden /> Geri al
          </button>
        )}
      </div>
    );
  }

  if (!storeApprovalOpen(order.status)) return <span className="text-slate-400 dark:text-zinc-500">—</span>;

  return (
    <button
      type="button"
      onClick={() => void actions.storeApprove(order, true)}
      disabled={busy}
      title="Stok kontrol edildi: sipariş hazırlanabilir (ödeme durumunu değiştirmez)"
      className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg py-1 leading-tight border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-emerald-500/10"
    >
      <PackageCheck className="h-3.5 w-3.5 shrink-0" aria-hidden /> Siparişi Onayla
    </button>
  );
}
