"use client";

import Image from "next/image";
import Link from "next/link";
import { Package, Trash2 } from "lucide-react";

import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { formatMoney } from "@/lib/format";
import { canOptimiseImage } from "@/lib/home";
import { useCartStore } from "@/store/useCartStore";
import type { CartLineItem, DecimalString } from "@/types";

interface CartLineRowProps {
  item: CartLineItem;
  /** Server-resolved unit price, when a quote is available. */
  serverUnitPrice?: DecimalString;
  /** The colour from the server quote; wins over the snapshot the cart stored. */
  serverColorName?: string | null;
  /** Product photo from the server quote (covers items added before photos were stored). */
  serverImageUrl?: string | null;
  /** Product page, when known. */
  productHref?: string;
  /** A B2B line with its list's havale switch on, and what a transfer takes off it now. */
  havaleEligible?: boolean;
  havaleDiscount?: DecimalString;
}

export function CartLineRow({
  item,
  serverUnitPrice,
  serverColorName,
  serverImageUrl,
  productHref,
  havaleEligible = false,
  havaleDiscount,
}: CartLineRowProps) {
  const image = serverImageUrl ?? item.image_url ?? null;
  // Which colour this line is. The quote is authoritative; the snapshot covers a
  // line added before the page had one.
  const color = serverColorName ?? item.color_name ?? null;
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  // Two colours of one product are two rows, so the colour belongs in the name a
  // screen reader hears on the stepper and the remove button.
  const label = color ? `${item.product_name} (${color})` : item.product_name;
  const unitPrice = Number(serverUnitPrice ?? item.segment_price ?? item.price);
  const lineTotal = unitPrice * item.quantity;

  return (
    <li className="flex gap-4 py-5">
      {/* Fixed square: the photo never shifts the row. Supplier photos are shot on white. */}
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-slate-400 ring-1 ring-black/5 dark:bg-zinc-100 sm:h-24 sm:w-24">
        {image ? (
          <Image
            src={image}
            alt={label}
            fill
            sizes="96px"
            unoptimized={!canOptimiseImage(image)}
            className="object-contain p-1.5 mix-blend-multiply"
          />
        ) : (
          <Package className="h-8 w-8" strokeWidth={1.25} aria-hidden />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {productHref ? (
              <Link href={productHref} className="hover:underline">
                {item.product_name}
              </Link>
            ) : (
              item.product_name
            )}
          </h3>
          {color && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Renk: <span className="font-medium text-slate-700 dark:text-zinc-200">{color}</span>
            </p>
          )}
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            {formatMoney(unitPrice)} <span className="text-xs">/ adet</span>
          </p>
          {havaleEligible && (
            <p className="mt-1.5 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
              {Number(havaleDiscount ?? 0) > 0
                ? `Havale/EFT indirimi −${formatMoney(havaleDiscount!)}`
                : "Havale/EFT ile ödemede indirimli"}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <QuantityStepper
            value={item.quantity}
            onChange={(q) => updateQuantity(item.variant_id, q)}
            label={label}
          />
          <p className="w-28 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
            {formatMoney(lineTotal)}
          </p>
          <button
            type="button"
            onClick={() => removeItem(item.variant_id)}
            className="rounded-md p-2 text-slate-400 dark:text-zinc-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            aria-label={`${label} ürününü sepetten çıkar`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
