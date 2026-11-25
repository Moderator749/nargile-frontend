"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarRange, ShoppingBag } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { adminCustomerOrders, type CustomerOrderHistory as History } from "@/lib/adminApi";
import { PAYMENT_METHOD_LABELS, linesSummary, rangeProblem } from "@/lib/customerOrders";
import { getApiErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/types";

const dateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });

/**
 * "Sipariş / Alışveriş Geçmişi": every order the customer placed, newest
 * first — when, its number (to the order's page), what was in it, the total,
 * how it was paid and where it stands — between two days if asked, with the
 * count and what was paid (approved, shipped, delivered; quotes aside).
 */
export function CustomerOrderHistory({ userId }: { userId: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState<string | null>(null);
  const problem = rangeProblem(from, to);

  useEffect(() => {
    if (problem) return;
    const controller = new AbortController();
    adminCustomerOrders(userId, { from, to }, controller.signal)
      .then((h) => {
        setHistory(h);
        setError(null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Sipariş geçmişi yüklenemedi."));
      });
    return () => controller.abort();
  }, [userId, from, to, problem]);

  const dateInput =
    "h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm tabular-nums dark:border-white/15 dark:bg-zinc-900";

  return (
    <section aria-labelledby="orders-heading" className={`${panelClass} mt-6 p-5 sm:p-6`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="orders-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
          Sipariş / Alışveriş Geçmişi
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
          <CalendarRange className="h-4 w-4" aria-hidden />
          <label className="flex items-center gap-1">
            Başlangıç
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={dateInput} />
          </label>
          <label className="flex items-center gap-1">
            Bitiş
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={dateInput} />
          </label>
          {(from || to) && (
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="rounded px-2 py-1 font-medium underline-offset-2 hover:underline"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {problem && <div className="mt-3"><Alert variant="error">{problem}</Alert></div>}
      {error && <div className="mt-3"><Alert variant="error">{error}</Alert></div>}

      {history && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Total label="Toplam sipariş" value={history.order_count.toLocaleString("tr-TR")} />
          <Total label="Ödenen sipariş" value={history.paid_count.toLocaleString("tr-TR")} />
          <Total label="Toplam harcama" value={formatMoney(history.total_spent)} hint="Onaylanan, kargolanan, teslim edilen" />
        </dl>
      )}

      <div className="mt-4 overflow-x-auto">
        {!history ? (
          <div className="h-40 rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
        ) : history.orders.length === 0 ? (
          <p className="flex items-center gap-2 py-6 text-sm text-slate-500 dark:text-zinc-400">
            <ShoppingBag className="h-4 w-4" aria-hidden /> {from || to ? "Bu tarihlerde sipariş yok." : "Henüz sipariş yok."}
          </p>
        ) : (
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th scope="col" className="py-2 pr-3">Tarih</th>
                <th scope="col" className="py-2 pr-3">Sipariş No</th>
                <th scope="col" className="py-2 pr-3">Ürünler</th>
                <th scope="col" className="py-2 pr-3 text-right">Tutar</th>
                <th scope="col" className="py-2 pr-3">Ödeme</th>
                <th scope="col" className="py-2">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {history.orders.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-slate-600 dark:text-zinc-400">
                    {dateTime.format(new Date(o.created_at))}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono font-semibold text-red-700 underline-offset-2 hover:underline dark:text-red-300"
                    >
                      {o.order_number}
                    </Link>
                    {o.is_quote && <span className="ml-1.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">Teklif</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-800 dark:text-zinc-200" title={linesSummary(o.lines, o.lines.length)}>
                    {linesSummary(o.lines)}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-right font-semibold tabular-nums">
                    {formatMoney(o.total_amount, o.currency === "TRY" ? "TRY" : (o.currency as "USD" | "EUR"))}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-slate-600 dark:text-zinc-400">
                    {PAYMENT_METHOD_LABELS[o.payment_method] ?? o.payment_method}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge status={o.status as OrderStatus} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function Total({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10" title={hint}>
      <dt className="text-xs text-slate-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}
