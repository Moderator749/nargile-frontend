"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, Bike, ClipboardList, Euro, DollarSign, Truck, UserCheck, Users, XCircle } from "lucide-react";

import { AdminOrdersView } from "@/components/admin/AdminOrdersView";
import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Pagination } from "@/components/admin/Pagination";
import { ExpandToggle, sheetId } from "@/components/admin/orders/ExpandToggle";
import { OrderSheet } from "@/components/admin/orders/OrderSheet";
import { canShipOrder, useOrderActions, type OrderActions, type OrderPatch } from "@/components/admin/orders/useOrderActions";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { adminDashboard, adminListOrdersPage } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney } from "@/lib/format";
import { orderNetTotal } from "@/lib/ordersApi";
import type { AdminDashboardData, AdminOrder, PeriodTotals } from "@/types";

const ORDERS_PER_PAGE = 25;

const PERIODS: { key: "daily" | "weekly" | "monthly" | "yearly"; label: string; hint: string }[] = [
  { key: "daily", label: "Günlük", hint: "Bugün 00:00'dan bu yana" },
  { key: "weekly", label: "Haftalık", hint: "Pazartesiden bu yana" },
  { key: "monthly", label: "Aylık", hint: "Ayın 1'inden bu yana" },
  { key: "yearly", label: "Yıllık", hint: "1 Ocak'tan bu yana" },
];

const KPIS: { title: string; value: (t: PeriodTotals) => string }[] = [
  { title: "Toplam sipariş adedi", value: (t) => t.order_count.toLocaleString("tr-TR") },
  { title: "Sipariş toplamı", value: (t) => formatMoney(t.order_total) },
  { title: "Kredi kartı toplamı", value: (t) => formatMoney(t.card_total) },
  { title: "Havale toplamı", value: (t) => formatMoney(t.transfer_total) },
];

/**
 * Row colour follows the sale type only (card grey, havale yellow), whatever the
 * status; the status is shown by the badge in the "Durum" column.
 */
function rowTone(o: AdminOrder): string {
  // Card grey is a step deeper than gray-50, which read as white on the white panel.
  return o.payment_method === "BANK_TRANSFER" ? "bg-yellow-50 dark:bg-yellow-500/10" : "bg-zinc-100 dark:bg-zinc-800/60";
}

const LEGEND = [
  { label: "Kredi kartı", className: "bg-zinc-200 dark:bg-zinc-700" },
  { label: "Havale / EFT", className: "bg-yellow-100 dark:bg-yellow-500/20" },
];

/** How the order travels and who pays for it; carriage is never on the order. */
function Cargo({ o }: { o: AdminOrder }) {
  if (o.shipping_method === "COURIER_ISTANBUL")
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-sky-700 dark:text-sky-300">
        <Bike className="h-3.5 w-3.5" aria-hidden /> Kurye
      </span>
    );
  if (o.tracking_code) return <span className="font-mono text-xs">{o.tracking_code}</span>;
  return (
    <span className="whitespace-nowrap text-slate-500 dark:text-zinc-400">
      {o.shipping_payer === "RECEIVER" ? "Alıcı öder" : "Ücretsiz"}
    </span>
  );
}

const cargoBtn =
  "inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[11px] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * "Kargoya ver" hands the order to the carrier and e-mails the customer;
 * "Reddet" cancels it, returning the stock and voiding the points it earned.
 * Only a paid order that has not shipped gets them.
 */
function CargoActions({ o, actions }: { o: AdminOrder; actions: OrderActions }) {
  const notice = actions.notice(o.id);
  if (!canShipOrder(o.status))
    return notice ? (
      <p
        className={`mt-1 text-[11px] leading-4 ${notice.kind === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
        role="status"
      >
        {notice.text}
      </p>
    ) : null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => actions.ship(o)}
        disabled={actions.busy(o.id)}
        title="Kargoya ver: müşteriye bilgilendirme e-postası gönderilir"
        className={`${cargoBtn} bg-emerald-600 text-white hover:bg-emerald-500`}
      >
        <Truck className="h-3.5 w-3.5" aria-hidden /> Kargoya ver
      </button>
      <button
        type="button"
        onClick={() => actions.cancel(o)}
        disabled={actions.busy(o.id)}
        title="Siparişi reddet: stok iade edilir, kazanılan puanlar geri alınır"
        className={`${cargoBtn} bg-white text-red-700 ring-1 ring-red-300 hover:bg-red-50 dark:bg-zinc-900 dark:text-red-300 dark:ring-red-500/30 dark:hover:bg-red-500/10`}
      >
        <XCircle className="h-3.5 w-3.5" aria-hidden /> Reddet
      </button>
      {notice?.kind === "error" && (
        <p className="basis-full text-[11px] leading-4 text-red-600 dark:text-red-400">{notice.text}</p>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub, href }: { icon: typeof Users; label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <>
      <Icon className="h-5 w-5 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{label}</p>
        <p className="truncate font-mono text-lg font-semibold tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 dark:text-zinc-400">{sub}</p>}
      </div>
    </>
  );
  const cls = "flex items-center gap-3 px-5 py-4";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Genel Bakış, per the business blueprint: status strip, sales KPIs, latest orders. */
export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<{ transfer: number; approval: number } | null>(null);
  const [page, setPage] = useState(0);
  const [orders, setOrders] = useState<{ page: number; rows: AdminOrder[]; total: number } | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  // The order management panel is a sub-view of this page, not a route of its own.
  const [managing, setManaging] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      adminDashboard(controller.signal),
      adminListOrdersPage({ page: 0, pageSize: 1, status: "AWAITING_TRANSFER" }, controller.signal),
      adminListOrdersPage({ page: 0, pageSize: 1, status: "PENDING_APPROVAL" }, controller.signal),
    ])
      .then(([dash, transfer, approval]) => {
        setData(dash);
        setQueue({ transfer: transfer.total, approval: approval.total });
      })
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setError(getApiErrorMessage(err, "Genel bakış yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    adminListOrdersPage({ page, pageSize: ORDERS_PER_PAGE }, controller.signal)
      .then(({ orders: rows, total }) => {
        setOrders({ page, rows, total });
        setOrdersError(null);
      })
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setOrdersError(getApiErrorMessage(err, "Siparişler yüklenemedi."));
      });
    return () => controller.abort();
  }, [page]);

  const patch = useCallback<OrderPatch>((id, changes) => {
    setOrders((prev) => (prev ? { ...prev, rows: prev.rows.map((o) => (o.id === id ? { ...o, ...changes } : o)) } : prev));
  }, []);
  const actions = useOrderActions(patch);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const rate = (v: string | null) => (v ? Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 4 }) : "—");

  return (
    <>
      <AdminPageHeader title="Genel Bakış" description="Ödenmiş siparişlere göre satış özeti (Türkiye saati), üyeler ve son siparişler." />

      {error && (
        <div className="mb-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Status strip */}
      <section aria-label="Durum" className={`${panelClass} grid grid-cols-2 divide-slate-200 overflow-hidden sm:grid-cols-4 sm:divide-x dark:divide-white/10`}>
        <StatTile icon={DollarSign} label="Dolar" value={data ? rate(data.usd_try) : "…"} sub={data?.rates_date ? `TCMB · ${data.rates_date}` : undefined} />
        <StatTile icon={Euro} label="Euro" value={data ? rate(data.eur_try) : "…"} sub={data?.rates_date ? "Döviz satış" : undefined} />
        <StatTile icon={Users} label="Üye sayısı" value={data ? data.member_count.toLocaleString("tr-TR") : "…"} sub="Kayıtlı müşteri" />
        <StatTile
          icon={UserCheck}
          label="Onay bekleyen"
          value={data ? data.pending_applications.toLocaleString("tr-TR") : "…"}
          sub="İşletme (B2B) başvurusu"
          href="/admin/customers"
        />
      </section>

      {/* Sales KPIs: four columns, three periods each */}
      <section aria-labelledby="kpi-heading" className="mt-6">
        <h2 id="kpi-heading" className="sr-only">
          Satış özeti
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <div key={kpi.title} className={`${panelClass} overflow-hidden`}>
              <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
                {kpi.title}
              </h3>
              <dl className="divide-y divide-slate-100 dark:divide-white/5">
                {PERIODS.map((p) => (
                  <div key={p.key} className="flex items-baseline justify-between gap-3 px-4 py-3" title={p.hint}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{p.label}</dt>
                    <dd className="font-mono text-base font-semibold tabular-nums">{data ? kpi.value(data[p.key]) : "…"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
          Yalnızca ödenmiş/onaylı siparişler, ödeme tarihine göre. İptal ve ödenmemiş siparişler dahil değildir. Tutar: müşterinin ödediği net tutar.
        </p>
      </section>

      {/* A real button, not a banner: it opens the order panel in place, below. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setManaging((v) => !v)}
          aria-expanded={managing}
          aria-controls="orders-panel"
          className="group inline-flex items-center gap-2.5 rounded-lg bg-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:translate-y-px motion-reduce:transform-none dark:bg-red-500 dark:shadow-red-500/20 dark:hover:bg-red-400"
        >
          <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />
          {managing ? "Sipariş Yönetimi Panelini Kapat" : "Sipariş Yönetimi Paneline Git"}
          <ArrowRight
            className={`h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
              managing ? "rotate-90" : "group-hover:translate-x-0.5"
            }`}
            aria-hidden
          />
        </button>
        {queue && (
          <ul className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <li className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-900 ring-1 ring-inset ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30">
              <strong className="font-mono">{queue.transfer}</strong> havale bekliyor
            </li>
            <li className="rounded-full bg-orange-100 px-3 py-1.5 text-orange-900 ring-1 ring-inset ring-orange-300 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-500/30">
              <strong className="font-mono">{queue.approval}</strong> onay bekliyor
            </li>
          </ul>
        )}
        <p className="basis-full text-xs text-slate-500 dark:text-zinc-400">
          Tüm siparişler, havale ve onay bekleyenler, kargo ve kurye işlemleri.
        </p>
      </div>

      {managing && (
        <div id="orders-panel" className="mt-6">
          <AdminOrdersView onClose={() => setManaging(false)} />
        </div>
      )}

      {/* Latest orders */}
      <section
        aria-labelledby="recent-heading"
        hidden={managing}
        className={`${panelClass} mt-6 overflow-hidden`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-white/10">
          <h2 id="recent-heading" className="text-sm font-semibold">
            Son siparişler
          </h2>
          <ul className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-zinc-400" aria-label="Renk açıklaması">
            {LEGEND.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-sm ${l.className}`} aria-hidden />
                {l.label}
              </li>
            ))}
          </ul>
        </div>

        {ordersError ? (
          <div className="p-4">
            <Alert variant="error">{ordersError}</Alert>
          </div>
        ) : !orders ? (
          <div className="h-64 motion-safe:animate-pulse" aria-busy />
        ) : orders.rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500 dark:text-zinc-400">Henüz sipariş yok.</p>
        ) : (
          <div className={`scrollbar-visible overflow-x-auto transition-opacity ${orders.page === page ? "" : "opacity-60"}`}>
            {/* min-w covers the fixed columns plus a readable Müşteri column: with
                table-fixed a short table would otherwise squeeze it to nothing and
                run "MÜŞTERİ" into "TARİH". */}
            <table className="w-full min-w-[1180px] table-fixed text-sm">
              <colgroup>
                <col className="w-10" />
                <col className="w-[10.5rem]" />
                <col className="w-[16rem]" />
                <col className="w-[9.5rem]" />
                <col className="w-[8rem]" />
                <col className="w-[8.5rem]" />
                <col className="w-[9.5rem]" />
                <col className="w-[11.5rem]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-zinc-500">
                  <th scope="col" className="px-2 py-3">
                    <span className="sr-only">Detay</span>
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Sipariş No</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Müşteri</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Tarih</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Satış şekli</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-right">Tutar</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Durum</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Kargo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white dark:divide-zinc-900">
                {orders.rows.map((o) => {
                  const expanded = open.has(o.id);
                  return (
                    <Fragment key={o.id}>
                      <tr className={rowTone(o)}>
                        <td className="px-2 py-2.5 align-top">
                          <ExpandToggle
                            expanded={expanded}
                            onToggle={() => toggle(o.id)}
                            controls={sheetId(o.id)}
                            orderNumber={o.order_number}
                          />
                        </td>
                        <td className="truncate px-4 py-2.5 font-mono text-xs font-semibold" title={o.order_number}>
                          {o.order_number}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="truncate font-medium" title={o.customer_name ?? undefined}>
                            {o.customer_name || o.shipping_address?.full_name || "—"}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-zinc-400" title={o.customer_email}>
                            {o.customer_email}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-xs">{formatDate(o.created_at)}</td>
                        <td className="px-4 py-2.5 text-xs">{o.payment_method === "BANK_TRANSFER" ? "Havale / EFT" : "Kredi kartı"}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">{formatMoney(orderNetTotal(o))}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-4 py-2.5 align-top text-xs">
                          <Cargo o={o} />
                          <CargoActions o={o} actions={actions} />
                        </td>
                      </tr>
                      {expanded && (
                        <tr id={sheetId(o.id)}>
                          <td colSpan={8} className="bg-white p-0 dark:bg-zinc-900">
                            <OrderSheet
                              order={o}
                              busy={actions.busy(o.id)}
                              notice={actions.notice(o.id)}
                              onApprove={() => actions.approve(o)}
                              onCancel={() => actions.cancel(o)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {orders && orders.total > ORDERS_PER_PAGE && (
          <div className="flex flex-col items-center gap-3 border-t border-slate-200 p-4 sm:flex-row sm:justify-between dark:border-white/10">
            <p className="text-xs tabular-nums text-slate-500 dark:text-zinc-400">
              {page * ORDERS_PER_PAGE + 1}–{Math.min((page + 1) * ORDERS_PER_PAGE, orders.total)} / {orders.total} sipariş
            </p>
            <Pagination page={page} pageCount={Math.ceil(orders.total / ORDERS_PER_PAGE)} onChange={setPage} label="Sipariş sayfaları" />
          </div>
        )}
      </section>
    </>
  );
}
