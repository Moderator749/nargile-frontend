"use client";

import { Check, MessageCircle, RotateCcw, ShieldCheck, Truck, Zap } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { track } from "@/lib/gaEvents";
import { productMessages } from "@/lib/i18n/messages/product";
import { DISTANCE_SALES_HREF } from "@/lib/legalPages";
import { productHref } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { STORES, WHATSAPP_STORE, whatsappLink } from "@/lib/stores";
import { useCartStore } from "@/store/useCartStore";
import { useCartHydrated } from "@/store/useHasHydrated";
import { shippingState, type ShippingState } from "@/lib/freeShipping";
import type { CatalogProduct, StoreParameters } from "@/types";

/** From this unit price up, the WhatsApp line is offered: a set worth a question before paying. */
export const WHATSAPP_ASK_FROM = 2500;

/**
 * Under "Sepete Ekle": whether this ships free (or how far off that is), the
 * shop's three guarantees, and — for a set worth a question — a WhatsApp line
 * with the product already named. The shipping line is a retail promotion
 * (`showShipping`): a firm's tier price never includes carriage, so it gets
 * none. Fixed heights, so nothing below moves when the cart loads.
 */
export function ShippingAndTrust({
  product,
  sku,
  unitPrice,
  quantity,
  variantId,
  params,
  showShipping,
}: {
  product: CatalogProduct;
  sku: string;
  /** VAT included, TRY; null while the price is unknown. */
  unitPrice: number | null;
  quantity: number;
  variantId: string;
  params: StoreParameters;
  showShipping: boolean;
}) {
  const t = useMessages(productMessages);
  const cartHydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);

  let state: ShippingState | null = null;
  if (showShipping && unitPrice !== null && cartHydrated) {
    const others = items.filter((i) => i.variant_id !== variantId);
    const amount = (i: (typeof items)[number]) => Number(i.segment_price ?? i.price) * i.quantity;
    state = shippingState(
      { amount: unitPrice * Math.max(1, quantity), coal: product.is_cart_rule_applied !== false },
      {
        amount: others.reduce((sum, i) => sum + amount(i), 0),
        coal: others.filter((i) => i.coal).reduce((sum, i) => sum + amount(i), 0),
      },
      params,
    );
  }
  const threshold = formatMoneyCompact(params.free_shipping_threshold);
  const coalMinimum =
    params.coal_rule_basis === "quantity" ? `${params.coal_min_quantity} adet` : `${Number(params.coal_min_kg)} kg`;

  const store = STORES.find((s) => s.slug === WHATSAPP_STORE);
  const asks = !!store?.whatsapp && unitPrice !== null && unitPrice >= WHATSAPP_ASK_FROM;
  const pageUrl = `${SITE_URL}${productHref(product)}`;

  return (
    <div className="mt-3 space-y-2.5">
      {showShipping && (
        // Its height is held while the cart loads, so the rows under it never jump.
        <div className="min-h-11">
          {state && (state.kind === "free_here" || state.kind === "free_with_cart") && (
            <p className="flex min-h-11 items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {state.kind === "free_here" ? t.freeHere : t.freeWithCart}
            </p>
          )}
          {state && (state.kind === "to_free" || state.kind === "coal") && (
            <div className="flex min-h-11 items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] leading-snug text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
              <p>
                {state.remaining > 0 ? t.toFree(threshold, formatMoney(state.remaining)) : t.freeOver(threshold)}
                {state.kind === "coal" && (
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-zinc-400">{t.coalNote(coalMinimum)}</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      <ul
        aria-label={t.trustLabel}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-600 dark:text-zinc-300"
      >
        <li className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          {t.trustOriginal}
        </li>
        <li className="inline-flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          {t.trustFast}
        </li>
        <li>
          {/* The right itself is article 6 of the distance sales agreement. */}
          <Link
            href={DISTANCE_SALES_HREF}
            className="inline-flex items-center gap-1 underline-offset-2 transition-colors duration-200 hover:text-slate-900 hover:underline dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            {t.trustReturn}
          </Link>
        </li>
      </ul>

      {asks && store?.whatsapp && (
        <a
          href={whatsappLink(store.whatsapp, t.whatsappMessage(product.name, sku, pageUrl))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            track("generate_lead", {
              currency: "TRY",
              value: unitPrice ?? 0,
              lead_source: "whatsapp_product_page",
              items: [{ item_id: sku, item_name: product.name, item_brand: product.brand ?? undefined }],
            })
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-600/40 bg-white px-4 text-sm font-semibold text-emerald-700 transition-colors duration-200 hover:border-emerald-600 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:w-auto dark:border-emerald-400/40 dark:bg-transparent dark:text-emerald-300 dark:hover:bg-emerald-500/10"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {t.whatsappAsk}
        </a>
      )}
    </div>
  );
}
