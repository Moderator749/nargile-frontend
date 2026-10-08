"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CartLineRow } from "@/components/cart/CartLineRow";
import { DeliveryForm, EMPTY_ADDRESS, addressProblem, type AddressDraft } from "@/components/cart/DeliveryForm";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useCartQuote } from "@/hooks/useCartQuote";
import { fetchMe } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";
import { buildCheckoutRequest, checkout, fetchLastAddress } from "@/lib/ordersApi";
import { productHref } from "@/lib/seo";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useAuthHydrated, useCartHydrated } from "@/store/useHasHydrated";
import type { PaymentMethod, ShippingMethod } from "@/types";

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
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("CARGO");
  // null until prefilled (last order's address, else the profile's name/phone).
  const [address, setAddress] = useState<AddressDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  // "Karşı ödemeli" consent; only asked for (and only sent) when the receiver pays.
  const [shippingConsent, setShippingConsent] = useState(false);

  const isLoggedIn = authHydrated && !!user;
  const balance = user?.loyalty_balance ?? 0;
  // Never send more points than the (freshly fetched) balance allows.
  const points = isLoggedIn ? Math.min(storedPoints, balance) : 0;

  useEffect(() => {
    if (token) refreshProfile();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchLastAddress(controller.signal)
      .then((last) => setAddress((current) => current ?? last))
      .catch(() => {
        // Non-critical: the form starts empty.
      });
    return () => controller.abort();
  }, [token]);

  const draft: AddressDraft = address ?? {
    ...EMPTY_ADDRESS,
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
  };
  const deliveryProblem = addressProblem(draft);

  const { quote, loading: quoteLoading, error: quoteError } = useCartQuote(
    items,
    paymentMethod,
    points,
    isLoggedIn,
    shippingMethod,
  );
  const needsConsent = !!quote?.shipping.receiver_pays;
  const checkoutBlocker =
    deliveryProblem ??
    (needsConsent && !shippingConsent
      ? "Gönderim ücretinin teslimatta alıcı tarafından ödeneceğini onaylayın."
      : null);
  const serverLines = new Map(quote?.items.map((i) => [i.variant_id, i]));
  const estimatedSubtotal = items.reduce(
    (sum, i) => sum + Number(i.segment_price ?? i.price) * i.quantity,
    0,
  );

  async function handleCheckout() {
    if (!isLoggedIn) {
      router.push("/login?next=/cart");
      return;
    }
    if (submitting || checkoutBlocker) return;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const order = await checkout(
        buildCheckoutRequest(items, paymentMethod, points, shippingMethod, draft, shippingConsent),
      );
      // Confirmation: bank details for havale/EFT, courier note, delivery address.
      router.push(`/orders/${order.id}/confirmation`);
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
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{itemCount.toLocaleString("tr-TR")} ürün</p>

      <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <section aria-labelledby="cart-items-heading" className="lg:col-span-2">
          <h2 id="cart-items-heading" className="sr-only">
            Sepetteki ürünler
          </h2>
          <ul className="divide-y divide-slate-200 dark:divide-white/10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 sm:px-6">
            {items.map((item) => {
              const line = serverLines.get(item.variant_id);
              return (
                <CartLineRow
                  key={item.variant_id}
                  item={item}
                  serverUnitPrice={line?.unit_price}
                  serverColorName={line?.color_name}
                  serverImageUrl={line?.image_url}
                  productHref={line?.product_id ? productHref(line.product_id) : undefined}
                />
              );
            })}
          </ul>
          {isLoggedIn && (
            <div className="mt-6">
              <DeliveryForm
                method={shippingMethod}
                onMethodChange={setShippingMethod}
                address={draft}
                onAddressChange={setAddress}
              />
            </div>
          )}
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
          shippingConsent={shippingConsent}
          onShippingConsentChange={setShippingConsent}
          submitting={submitting}
          checkoutError={checkoutError}
          blocker={isLoggedIn ? checkoutBlocker : null}
        />
      </div>
    </main>
  );
}
