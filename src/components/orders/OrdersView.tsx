"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { PackageCheck } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney } from "@/lib/format";
import { fetchMyOrders, orderNetTotal } from "@/lib/ordersApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { Order, OrderStatus } from "@/types";

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_APPROVAL: { label: "Onay bekliyor", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  APPROVED: { label: "Onaylandı", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  SHIPPED: { label: "Kargoya verildi", className: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  CANCELLED: { label: "İptal edildi", className: "bg-slate-100 text-slate-600 ring-slate-200" },
};

interface OrdersResult {
  token: string;
  orders: Order[] | null;
  error: string | null;
}

export function OrdersView({ placedOrderNumber }: { placedOrderNumber: string | null }) {
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
        setResult({ token, orders: null, error: getApiErrorMessage(err, "Siparişler yüklenemedi.") });
      });
    return () => controller.abort();
  }, [token]);

  const current = token && result?.token === token ? result : null;
  const placed = current?.orders?.find((o) => o.order_number === placedOrderNumber);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      {placedOrderNumber && (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-emerald-900">Siparişiniz başarıyla alındı!</h2>
              <p className="text-sm text-emerald-800">
                Sipariş numaranız: <strong className="font-mono">{placedOrderNumber}</strong>
              </p>
              {placed?.payment_method === "BANK_TRANSFER" && placed.status === "PENDING_APPROVAL" && (
                <p className="text-sm text-emerald-800">
                  Lütfen {formatMoney(orderNetTotal(placed))} tutarındaki havaleyi açıklamaya sipariş
                  numaranızı yazarak <strong>48 saat içinde</strong> yapın; aksi halde sipariş otomatik
                  iptal edilir.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Siparişlerim</h1>

      <div className="mt-6">
        {!hydrated || (token && !current) ? (
          <div className="space-y-3" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !token ? (
          <p className="text-sm text-slate-600">
            Siparişlerinizi görmek için{" "}
            <Link href="/login?next=/orders" className="font-semibold text-indigo-600 hover:text-indigo-500">
              giriş yapın
            </Link>
            .
          </p>
        ) : current?.error ? (
          <Alert variant="error">{current.error}</Alert>
        ) : current?.orders?.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            Henüz siparişiniz yok.{" "}
            <Link href="/catalog" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Kataloğa göz atın
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {current?.orders?.map((order) => (
              <li
                key={order.id}
                className={`rounded-xl border bg-white p-4 shadow-sm sm:p-5 ${
                  order.order_number === placedOrderNumber ? "border-emerald-300" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDate(order.created_at)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS[order.status].className}`}
                  >
                    {STATUS[order.status].label}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-2 text-sm">
                  <p className="text-slate-600">
                    {order.items.reduce((n, i) => n + i.quantity, 0)} ürün ·{" "}
                    {order.payment_method === "BANK_TRANSFER" ? "Havale / EFT" : "Kredi Kartı"}
                    {order.tracking_code && <> · Kargo takip: {order.tracking_code}</>}
                  </p>
                  <p className="text-base font-bold tabular-nums">{formatMoney(orderNetTotal(order))}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
