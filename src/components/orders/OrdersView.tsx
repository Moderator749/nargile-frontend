"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ExternalLink, PackageCheck } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney } from "@/lib/format";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { ordersMessages } from "@/lib/i18n/messages/orders";
import { shippingOption } from "@/lib/shipping";
import { fetchMyOrders, orderNetTotal } from "@/lib/ordersApi";
import { carrierName, trackingHref } from "@/lib/tracking";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { Order } from "@/types";

interface OrdersResult {
  token: string;
  orders: Order[] | null;
  error: string | null;
}

export function OrdersView({ placedOrderNumber }: { placedOrderNumber: string | null }) {
  const locale = useLocale();
  const t = useMessages(ordersMessages).list;
  const loadFailed = t.loadFailed;
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [result, setResult] = useState<OrdersResult | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchMyOrders(controller.signal)
      .then((orders) => setResult({ token, orders, error: null }))
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setResult({ token, orders: null, error: getApiErrorMessage(err, loadFailed) });
      });
    return () => controller.abort();
  }, [token, loadFailed]);

  const current = token && result?.token === token ? result : null;
  const placed = current?.orders?.find((o) => o.order_number === placedOrderNumber);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>

      {placedOrderNumber && (
        <div className="mt-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{t.placed}</h2>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                {t.orderNumber} <strong className="font-mono">{placedOrderNumber}</strong>
              </p>
              {placed?.payment_method === "BANK_TRANSFER" && placed.status === "AWAITING_TRANSFER" && (
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  {t.transferBefore(formatMoney(orderNetTotal(placed)))}
                  <strong>{t.transferDeadline}</strong>
                  {t.transferAfter}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        {!hydrated || (token && !current) ? (
          <div className="space-y-3" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
            ))}
          </div>
        ) : !token ? (
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            {t.signInBefore}
            <Link href="/login?next=/orders" className="font-semibold text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300">
              {t.signInLink}
            </Link>
            {t.signInAfter}
          </p>
        ) : current?.error ? (
          <Alert variant="error">{current.error}</Alert>
        ) : current?.orders?.length === 0 ? (
          <p className="py-12 text-center text-slate-500 dark:text-zinc-400">
            {t.empty}{" "}
            <Link href="/catalog" className="font-semibold text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300">
              {t.browse}
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {current?.orders?.map((order) => (
              <li
                key={order.id}
                className={`rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm sm:p-5 ${
                  order.order_number === placedOrderNumber ? "border-emerald-300 dark:border-emerald-500/40" : "border-slate-200 dark:border-white/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{formatDate(order.created_at, INTL_LOCALE[locale])}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-2 text-sm">
                  <p className="text-slate-600 dark:text-zinc-400">
                    {t.items(order.items.reduce((n, i) => n + i.quantity, 0))} ·{" "}
                    {order.payment_method === "BANK_TRANSFER" ? t.bankTransfer : t.creditCard}
                    {order.shipping_method !== "YURTICI_DOOR" && <> · {shippingOption(order.shipping_method, locale).title}</>}
                    {(order.status === "SHIPPED" || order.status === "DELIVERED") && carrierName(order, locale) && <> · {carrierName(order, locale)}</>}
                    {order.tracking_code && <> · {t.trackingNo} <span className="font-mono">{order.tracking_code}</span></>}
                  </p>
                  <p className="text-base font-bold tabular-nums">{formatMoney(orderNetTotal(order))}</p>
                </div>
                {trackingHref(order) && (
                  <a
                    href={trackingHref(order) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:underline dark:text-red-400"
                  >
                    {t.track} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                )}
                {order.status === "AWAITING_TRANSFER" && (
                  <Link
                    href={`/orders/${order.id}/confirmation`}
                    className="mt-3 inline-flex text-sm font-medium text-amber-700 hover:underline dark:text-amber-300"
                  >
                    {t.seePayment}
                    {/* The arrow points the way the page reads. */}
                    <span aria-hidden className="ms-1 inline-block rtl:-scale-x-100">
                      →
                    </span>
                  </Link>
                )}
                {order.status === "CANCELLED" && order.cancel_reason && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                    {t.cancelReason} {order.cancel_reason}
                  </p>
                )}
                {order.status === "RETURNED" && order.return_reason && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                    {t.returnReason} {order.return_reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
