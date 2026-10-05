"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CartLineRow } from "@/components/cart/CartLineRow";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useCartQuote } from "@/hooks/useCartQuote";
import { fetchMe } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";
import { buildCheckoutRequest, checkout } from "@/lib/ordersApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useAuthHydrated, useCartHydrated } from "@/store/useHasHydrated";
import type { PaymentMethod } from "@/types";

/** Refresh the profile so the ParaPuan balance and segment are current. */
function refreshProfile() {
  fetchMe()
    .then((user) => useAuthStore.getState().setUser(user))
    .catch(() => {
      // Non-critical: the persisted profile stays; a 401 is handled by the interceptor.
    });
}

export function CartView() {
  const router = useRouter();
  const cartHydrated = useCartHydrated();
  const authHydrated = useAuthHydrated();

  const items = useCartStore((s) => s.items);
  const storedPoints = useCartStore((s) => s.loyaltyPointsToRedeem);
  const setPoints = useCartStore((s) => s.setLoyaltyPointsToRedeem);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CREDIT_CARD");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isLoggedIn = authHydrated && !!user;
  const balance = user?.loyalty_balance ?? 0;
  // Never send more points than the (freshly fetched) balance allows.
  const points = isLoggedIn ? Math.min(storedPoints, balance) : 0;

  useEffect(() => {
    if (token) refreshProfile();
  }, [token]);

  const { quote, loading: quoteLoading, error: quoteError } = useCartQuote(
    items,
    paymentMethod,
    points,
    isLoggedIn,
  );
  const serverPrices = new Map(quote?.items.map((i) => [i.variant_id, i.unit_price]));
  const estimatedSubtotal = items.reduce(
    (sum, i) => sum + Number(i.segment_price ?? i.price) * i.quantity,
    0,
  );

  async function handleCheckout() {
    if (!isLoggedIn) {
      router.push("/login?next=/cart");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const order = await checkout(buildCheckoutRequest(items, paymentMethod, points));
      router.push(`/orders?placed=${encodeURIComponent(order.order_number)}`);
      useCartStore.getState().clearCart();
      refreshProfile(); // ParaPuan balance changed
      // Keep `submitting` so the page doesn't flash the empty-cart state while navigating.
    } catch (err) {
      setCheckoutError(getApiErrorMessage(err, "Sipariş oluşturulamadı. Lütfen tekrar deneyin."));
      setSubmitting(false);
    }
  }

  if (!cartHydrated) {
    return <main className="flex-1" aria-busy />;
  }

  if (items.length === 0 && !submitting) {
    return (
      <main className="flex-1 px-4">
        <EmptyCart />
      </main>
    );
  }

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sepetim</h1>
      <p className="mt-1 text-sm text-slate-500">{itemCount.toLocaleString("tr-TR")} ürün</p>

      <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <section aria-label="Sepetteki ürünler" className="lg:col-span-2">
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-4 sm:px-6">
            {items.map((item) => (
              <CartLineRow
                key={item.variant_id}
                item={item}
                serverUnitPrice={serverPrices.get(item.variant_id)}
              />
            ))}
          </ul>
        </section>

        <OrderSummary
          isLoggedIn={isLoggedIn}
          estimatedSubtotal={estimatedSubtotal}
          quote={quote}
          quoteLoading={quoteLoading}
          quoteError={quoteError}
          balance={balance}
          points={points}
          onPointsChange={setPoints}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onCheckout={handleCheckout}
          submitting={submitting}
          checkoutError={checkoutError}
        />
      </div>
    </main>
  );
}
