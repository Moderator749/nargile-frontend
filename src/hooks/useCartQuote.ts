"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { buildCheckoutRequest, calculateCart } from "@/lib/ordersApi";
import { getApiErrorMessage } from "@/lib/errors";
import { cartMessages } from "@/lib/i18n/messages/cart";
import type { Cart, CartLineItem, PaymentMethod, ShippingMethod } from "@/types";

const DEBOUNCE_MS = 400;

interface QuoteResult {
  key: string;
  quote: Cart | null;
  error: string | null;
}

/**
 * Live server-side price breakdown (POST /orders/calculate-cart) for the current
 * cart. Debounced so +/- clicks don't flood the API. Disabled when `enabled` is
 * false (logged out) — the caller falls back to a local estimate.
 */
export function useCartQuote(
  items: CartLineItem[],
  paymentMethod: PaymentMethod,
  pointsToRedeem: number,
  enabled: boolean,
  shippingMethod: ShippingMethod = "YURTICI_DOOR",
) {
  // The address isn't needed to price the cart (courier eligibility is enforced in the form).
  const payload = buildCheckoutRequest(items, paymentMethod, pointsToRedeem, shippingMethod);
  const key = enabled && items.length > 0 ? JSON.stringify(payload) : null;
  const [result, setResult] = useState<QuoteResult | null>(null);
  const failed = useMessages(cartMessages).view.quoteFailed;

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      calculateCart(JSON.parse(key), controller.signal)
        .then((quote) => setResult({ key, quote, error: null }))
        .catch((err: unknown) => {
          if (axios.isCancel(err)) return;
          setResult({
            key,
            quote: null,
            error: getApiErrorMessage(err, failed),
          });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, failed]);

  const current = key !== null && result?.key === key ? result : null;
  // While a new quote loads, keep showing the previous one (dimmed by the caller).
  const shown = key === null ? null : (current ?? result);
  return {
    quote: shown?.quote ?? null,
    error: current?.error ?? null,
    /** True while the shown quote doesn't match the cart yet. */
    loading: key !== null && current === null,
  };
}
