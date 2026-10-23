"use client";

import Image from "next/image";
import { Package, Trash2 } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { colorLabel } from "@/lib/i18n/colors";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { formatMoney } from "@/lib/format";
import { cartMessages } from "@/lib/i18n/messages/cart";
import { canOptimiseImage } from "@/lib/home";
import { showCartToast } from "@/lib/cartToast";
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
  /** The most of it the buyer may order, where known (a firm's quota, or a limit already met); none otherwise. */
  maxQuantity?: number | null;
  /** Just taken down to the most there is: the stepper says so, never the number. */
  limitReached?: boolean;
  /** None left of it (a visitor's line): say so, so it is taken out before checkout. */
  soldOut?: boolean;
  /** A new quantity, which the cart holds to the stock (CartView). */
  onQuantityChange: (quantity: number) => void;
  /** The colour's product code, from the quote or the visitor's line lookup. */
  sku?: string | null;
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
  maxQuantity,
  limitReached = false,
  soldOut = false,
  onQuantityChange,
  sku,
}: CartLineRowProps) {
  const t = useMessages(cartMessages).line;
  const image = serverImageUrl ?? item.image_url ?? null;
  // Which colour this line is. The quote is authoritative; the snapshot covers a
  // line added before the page had one.
  const locale = useLocale();
  // Shown in the page's language; the stored name stays the line's key.
  const typed = serverColorName ?? item.color_name ?? null;
  const color = typed ? colorLabel(typed, locale) : null;
  const removeItem = useCartStore((s) => s.removeItem);

  // Two colours of one product are two rows, so the colour belongs in the name a
  // screen reader hears on the stepper and the remove button.
  const label = color ? `${item.product_name} (${color})` : item.product_name;
  // Taken out with a way back: "‘…’ sepetten kaldırıldı · Geri Al" puts the
  // line back where it was, at the quantity it had.
  function remove() {
    const before = useCartStore.getState().items;
    const index = before.findIndex((i) => i.variant_id === item.variant_id);
    const line = before[index];
    removeItem(item.variant_id);
    if (!line) return;
    showCartToast({
      kind: "removed",
      name: label,
      image,
      undo: () => useCartStore.getState().restoreItem(line, index),
    });
  }

  const unitPrice = Number(serverUnitPrice ?? item.segment_price ?? item.price);
  const lineTotal = unitPrice * item.quantity;

  // The photo leads to the product as its name does.
  const photo = (
    <div className="relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-slate-400 ring-1 ring-black/5 dark:bg-zinc-100 sm:h-24 sm:w-24">
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
  );

  /*
   * Two tiers on a phone: the photo, the name (with its code) and the bin on
   * top; the quantity and the line's total under them, across the row. One
   * row from `sm`. Every column may shrink (`minmax(0,1fr)`, `min-w-0`) and the
   * figures never wrap, so nothing in a line can push the page wider than the
   * screen.
   */
  return (
    <li
      className={`grid grid-cols-[4.5rem_minmax(0,1fr)_auto] gap-x-3 gap-y-3 py-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-4 sm:py-5 ${
        // Room for the stepper's note under it.
        limitReached ? "pb-12 sm:pb-12" : ""
      }`}
    >
      {/* Fixed square: the photo never shifts the row. Supplier photos are shot on white. */}
      {productHref ? (
        <Link href={productHref} tabIndex={-1} aria-hidden className="col-start-1 row-start-1">
          {photo}
        </Link>
      ) : (
        <div className="col-start-1 row-start-1">{photo}</div>
      )}

      <div className="col-start-2 row-start-1 min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
          {productHref ? (
            <Link href={productHref} className="hover:underline">
              {item.product_name}
            </Link>
          ) : (
            item.product_name
          )}
        </h3>
        {sku && <p className="mt-0.5 truncate font-mono text-xs text-slate-500 dark:text-zinc-400">{t.code(sku)}</p>}
        {color && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            {t.color} <span className="font-medium text-slate-700 dark:text-zinc-200">{color}</span>
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          <span className="whitespace-nowrap">{formatMoney(unitPrice)}</span> <span className="text-xs">{t.perUnit}</span>
        </p>
        {soldOut && (
          <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">{t.soldOut}</p>
        )}
        {havaleEligible && (
          <p className="mt-1.5 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
            {Number(havaleDiscount ?? 0) > 0
              ? t.havaleDiscount(formatMoney(havaleDiscount!))
              : t.havaleEligible}
          </p>
        )}
      </div>

      <div className="col-span-3 row-start-2 flex min-w-0 items-center justify-between gap-3 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:justify-end sm:gap-4">
        <QuantityStepper
          value={item.quantity}
          onChange={onQuantityChange}
          label={label}
          max={maxQuantity}
          limitReached={limitReached}
        />
        <p className="whitespace-nowrap text-end text-sm font-semibold tabular-nums text-slate-900 sm:w-28 dark:text-zinc-100">
          {formatMoney(lineTotal)}
        </p>
      </div>

      <button
        type="button"
        onClick={remove}
        className="col-start-3 row-start-1 flex h-11 w-11 items-center justify-center self-start rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:col-start-4 sm:self-center dark:text-zinc-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        aria-label={t.remove(label)}
      >
        <Trash2 className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </li>
  );
}
