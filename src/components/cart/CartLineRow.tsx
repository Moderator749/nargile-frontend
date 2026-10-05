"use client";

import { Package, Trash2 } from "lucide-react";

import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { formatMoney } from "@/lib/format";
import { useCartStore } from "@/store/useCartStore";
import type { CartLineItem, DecimalString } from "@/types";

interface CartLineRowProps {
  item: CartLineItem;
  /** Server-resolved unit price, when a quote is available. */
  serverUnitPrice?: DecimalString;
}

export function CartLineRow({ item, serverUnitPrice }: CartLineRowProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const unitPrice = Number(serverUnitPrice ?? item.segment_price ?? item.price);
  const lineTotal = unitPrice * item.quantity;

  return (
    <li className="flex gap-4 py-5">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 sm:h-24 sm:w-24">
        <Package className="h-8 w-8" strokeWidth={1.25} aria-hidden />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{item.product_name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {formatMoney(unitPrice)} <span className="text-xs">/ adet</span>
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <QuantityStepper
            value={item.quantity}
            onChange={(q) => updateQuantity(item.variant_id, q)}
            label={item.product_name}
          />
          <p className="w-28 text-right text-sm font-semibold tabular-nums text-slate-900">
            {formatMoney(lineTotal)}
          </p>
          <button
            type="button"
            onClick={() => removeItem(item.variant_id)}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`${item.product_name} ürününü sepetten çıkar`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
