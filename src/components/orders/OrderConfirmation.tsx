"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CircleCheck, CircleX, Landmark, Loader2, UserCheck } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { BankAccountList, CopyButton } from "@/components/payment/BankAccounts";
import { Alert } from "@/components/ui/Alert";
import { countryName } from "@/lib/countries";
import { getApiErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { ordersMessages } from "@/lib/i18n/messages/orders";
import { fetchBankAccounts, fetchOrder, orderNetTotal } from "@/lib/ordersApi";
import { shippingOption } from "@/lib/shipping";
import { useAuthHydrated } from "@/store/useHasHydrated";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import type { BankAccount, Order } from "@/types";

/** Must match the backend's SLA (order_tasks.SLA_HOURS). */
const TRANSFER_DEADLINE_HOURS = 48;
const noSubscription = () => () => {};
/** Inside PayTR's frame: where PayTR sends the customer back to. */
const isFramed = () => window.top !== window.self;
/** "?payment=ok": the browser came straight back from a PayTR payment. */
const backFromPaytr = () => new URLSearchParams(window.location.search).get("payment") === "ok";

/** How long to wait for PayTR's notification before saying it is taking a while. */
const PAYMENT_POLL_MS = 3000;
const PAYMENT_POLLS = 20;

/**
 * After checkout: what was ordered and — for havale/EFT — where to pay; for a
 * card, how the payment went.
 *
 * A card payment ends here twice over. PayTR sends the customer's browser back
 * (inside its frame, which this page steps out of), and separately notifies
 * the server, which is what actually marks the order paid or failed. The two
 * can arrive in either order, so while the order still says AWAITING_PAYMENT
 * the page asks again every few seconds instead of guessing.
 */
export function OrderConfirmation({ orderId }: { orderId: string }) {
  const locale = useLocale();
  const t = useMessages(ordersMessages).confirmation;
  const notFound = t.notFound;
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [order, setOrder] = useState<Order | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polls, setPolls] = useState(0);
  // Browser facts, false while rendering on the server.
  const framed = useSyncExternalStore(noSubscription, isFramed, () => false);
  const fromPaytr = useSyncExternalStore(noSubscription, backFromPaytr, () => false);

  // PayTR returns the customer inside its frame: carry the page to the top.
  useEffect(() => {
    if (framed && window.top) window.top.location.href = window.location.href;
  }, [framed]);

  useEffect(() => {
    if (!hydrated || !token || framed) return;
    const controller = new AbortController();
    fetchOrder(orderId, controller.signal)
      .then(async (o) => {
        setOrder(o);
        if (o.payment_method === "BANK_TRANSFER") setAccounts(await fetchBankAccounts(controller.signal));
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, notFound));
      });
    return () => controller.abort();
  }, [hydrated, token, orderId, framed, notFound]);

  // Waiting for PayTR's word: ask again until it has come, or for a minute.
  const awaitingCard = order?.status === "AWAITING_PAYMENT";
  useEffect(() => {
    if (!awaitingCard || polls >= PAYMENT_POLLS) return;
    const t = setTimeout(() => {
      fetchOrder(orderId)
        .then(setOrder)
        .catch(() => {})
        .finally(() => setPolls((n) => n + 1));
    }, PAYMENT_POLL_MS);
    return () => clearTimeout(t);
  }, [awaitingCard, polls, orderId]);

  // The cart was kept while the card was being charged, so a failed payment
  // could be tried again; now that it is paid, it has done its job.
  const paidByCard = order?.payment_method === "CREDIT_CARD" && (order.status === "APPROVED" || order.status === "SHIPPED");
  useEffect(() => {
    if (fromPaytr && paidByCard) useCartStore.getState().clearCart();
  }, [fromPaytr, paidByCard]);

  if (framed) return <main className="flex-1" aria-busy />;

  if (hydrated && !token) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <Alert variant="error">{t.signIn}</Alert>
      </main>
    );
  }
  if (error) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <Alert variant="error">{error}</Alert>
      </main>
    );
  }
  if (!order) return <main className="flex-1" aria-busy />;

  const net = orderNetTotal(order);
  const transfer = order.payment_method === "BANK_TRANSFER";
  const card = order.payment_method === "CREDIT_CARD";
  const failed = order.status === "PAYMENT_FAILED";
  const heading = !card ? t.received : failed ? t.failed : awaitingCard ? t.verifying : t.paid;
  const HeadIcon = failed ? CircleX : awaitingCard ? Loader2 : CircleCheck;
  const ownVan = order.shipping_method === "ISTANBUL_FREE";
  const shipping = shippingOption(order.shipping_method, locale);
  const { Icon } = shipping;
  const a = order.shipping_address;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <div className="text-center">
        <HeadIcon
          className={`mx-auto h-12 w-12 ${
            failed ? "text-red-600" : awaitingCard ? "text-slate-400 motion-safe:animate-spin" : "text-emerald-600"
          }`}
          strokeWidth={1.5}
          aria-hidden
        />
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl" aria-live="polite">
          {heading}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          {t.orderNo} <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">{order.order_number}</span>
        </p>
      </div>

      {card && awaitingCard && (
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-zinc-400" aria-live="polite">
          {polls < PAYMENT_POLLS ? t.waiting : t.waitingLong}
        </p>
      )}
      {failed && (
        <div className="mt-8 space-y-4 text-center">
          <Alert variant="error">
            {order.cancel_reason ?? t.cardFailed} {t.refunded}
          </Alert>
          <Link
            href="/cart"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500"
          >
            {t.retry}
          </Link>
        </div>
      )}

      {transfer && order.status === "AWAITING_TRANSFER" && (
        <section aria-labelledby="pay-heading" className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-500/30 dark:bg-amber-500/5 sm:p-6">
          <h2 id="pay-heading" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Landmark className="h-5 w-5" aria-hidden /> {t.transferHeading}
          </h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300">
            {t.transferBefore}
            <strong className="font-mono">{formatMoney(net)}</strong>
            {t.transferAfter(TRANSFER_DEADLINE_HOURS)}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 dark:bg-zinc-900">
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{t.reference}</p>
              <p className="font-mono text-sm font-semibold">{order.order_number}</p>
            </div>
            <CopyButton text={order.order_number} label={t.copyOrderNo} />
          </div>

          {accounts === null ? (
            <div className="mt-3 h-24 rounded-xl bg-white/60 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
          ) : accounts.length === 0 ? (
            <div className="mt-3">
              <Alert variant="error">{t.noAccounts}</Alert>
            </div>
          ) : (
            <div className="mt-3">
              <BankAccountList accounts={accounts} />
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="delivery-heading" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
        <h2 id="delivery-heading" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          {/* The method's own name, so the page says what will actually happen. */}
          <Icon className="h-5 w-5" aria-hidden />
          {shipping.title}
        </h2>
        {ownVan ? (
          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">{t.ownVan}</p>
        ) : order.shipping_payer === "RECEIVER" ? (
          // Carriage is never added to the order; the buyer accepted paying it on delivery.
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{t.receiverPays}</p>
        ) : (
          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">{t.shopPays}</p>
        )}
        {/* "Şubeme istiyorum": the branch the goods were sent to, named so the
            firm can see which one this order was for. */}
        {order.shipping_branch_name && (
          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {order.shipping_branch_name}
          </p>
        )}
        {a && (
          <address className="mt-1 text-sm not-italic leading-6 text-slate-700 dark:text-zinc-300">
            {/* Left to right, so a "+49 …" number keeps its plus in front on an Arabic page. */}
            {a.full_name} · <span dir="ltr">{a.phone}</span>
            <br />
            {a.line}
            <br />
            {[a.district, a.city].filter(Boolean).join(" / ")}
            {a.country !== "TR" && <> · {countryName(a.country, locale)}</>}
          </address>
        )}
        {order.receiver_name && (
          <p className="mt-3 flex gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600 dark:bg-white/5 dark:text-zinc-300">
            <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              {t.receiver} <strong className="font-semibold">{order.receiver_name}</strong> ·{" "}
              <span dir="ltr">{order.receiver_phone}</span>
            </span>
          </p>
        )}
        <dl className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-bold dark:border-white/10">
          <dt>{t.total}</dt>
          <dd className="font-mono">{formatMoney(net)}</dd>
        </dl>
      </section>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/orders" className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-zinc-900">
          {t.myOrders}
        </Link>
        <Link href="/catalog" className="inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-zinc-300 dark:ring-white/15 dark:hover:bg-white/5">
          {t.continueShopping}
        </Link>
      </div>
    </main>
  );
}
