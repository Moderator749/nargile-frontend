"use client";

import { ChevronDown } from "lucide-react";

import type { OrderActions } from "@/components/admin/orders/useOrderActions";
import type { AdminOrder } from "@/types";

/**
 * The cargo decisions an approved order is waiting for. A native select keeps
 * the whole menu inside its table cell at any width, and no choice fires
 * blind: "Kargola" opens the shipping dialog, "Mağazadan Teslim" asks first and
 * "iptal" asks for a reason.
 */
export function CargoSelect({ order, actions }: { order: AdminOrder; actions: OrderActions }) {
  const busy = actions.busy(order.id);
  return (
    <div className="relative">
      <select
        aria-label={`${order.order_number} kargo işlemi`}
        disabled={busy}
        /* Always back on the placeholder: the select issues commands, it does not
           hold a value. */
        value=""
        onChange={(e) => {
          if (e.target.value === "ship") void actions.ship(order);
          else if (e.target.value === "store") void actions.deliverInStore(order);
          else if (e.target.value === "cancel") void actions.cancel(order);
        }}
        className="h-8 w-full cursor-pointer appearance-none rounded-md border border-slate-300 bg-white pl-2 pr-6 text-[11px] font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-white/5"
      >
        <option value="" disabled>
          Kargo işlemi…
        </option>
        <option value="ship">Kargola…</option>
        <option value="store">Mağazadan Teslim</option>
        <option value="cancel">Kargoyu İptal Et</option>
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 dark:text-zinc-400"
        aria-hidden
      />
    </div>
  );
}
