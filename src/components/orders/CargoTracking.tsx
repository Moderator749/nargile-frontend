"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { ExternalLink, PackageSearch, Truck } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { OrderLookupForm } from "@/components/orders/OrderLookupForm";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/format";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { ordersMessages } from "@/lib/i18n/messages/orders";
import { fetchMyOrders } from "@/lib/ordersApi";
import { carrierName, trackingHref, yurticiTrackingUrl } from "@/lib/tracking";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { Order } from "@/types";

/** Orders a customer would come here about: on their way (or just delivered by the carrier), or paid and about to be. */
const following = (o: Order) =>
  o.status === "SHIPPED" || o.status === "APPROVED" || (o.status === "DELIVERED" && o.carrier !== "STORE");

/**
 * "Kargo Takip": a Yurtiçi tracking number goes straight to Yurtiçi's own page
 * (no account needed, nothing of ours is looked up), and a signed-in customer
 * also finds their recent shipments here, each with its tracking link.
 */
export function CargoTracking() {
  const locale = useLocale();
  const t = useMessages(ordersMessages).tracking;
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [code, setCode] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchMyOrders(controller.signal)
      .then((all) => setOrders(all.filter(following).slice(0, 10)))
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setOrders([]);
      });
    return () => controller.abort();
  }, [hydrated, token]);

  function track(event: FormEvent) {
    event.preventDefault();
    const value = code.trim();
    if (value) window.open(yurticiTrackingUrl(value), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="track-by-code">
        <h2 id="track-by-code" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <PackageSearch className="h-5 w-5 text-red-600" aria-hidden /> {t.byCode}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{t.byCodeNote}</p>
        <form onSubmit={track} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label={t.codeLabel}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              maxLength={40}
              className="font-mono"
            />
          </div>
          <Button type="submit" disabled={!code.trim()} className="sm:w-auto!">
            {t.query} <ExternalLink className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      </section>

      {/* By order number and e-mail: a guest's way back, signed in or not. */}
      <OrderLookupForm />

      <section aria-labelledby="my-shipments">
        <h2 id="my-shipments" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Truck className="h-5 w-5 text-red-600" aria-hidden /> {t.myShipments}
        </h2>
        {!hydrated ? null : !token ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
            {t.signInBefore}
            <Link href="/login?next=/kargo-takip" className="font-medium text-red-700 hover:underline dark:text-red-400">
              {t.signInLink}
            </Link>
            {t.signInAfter}
          </p>
        ) : orders === null ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">{t.loading}</p>
        ) : orders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
            {t.none}{" "}
            <Link href="/orders" className="font-medium text-red-700 hover:underline dark:text-red-400">
              {t.allOrders}
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {orders.map((order) => {
              const href = trackingHref(order);
              return (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {order.status === "SHIPPED" || order.status === "DELIVERED"
                        ? [
                            carrierName(order, locale),
                            order.shipped_at && t.shippedOn(formatDate(order.shipped_at, INTL_LOCALE[locale])),
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : t.preparing}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:underline dark:text-red-400"
                      >
                        {t.track} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    ) : (order.status === "SHIPPED" || order.status === "DELIVERED") && order.tracking_code ? (
                      <span className="font-mono text-sm">{order.tracking_code}</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
