"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { CircleCheck, CreditCard, Landmark, RefreshCw, Van, X, XCircle } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { CargoSelect } from "@/components/admin/orders/CargoSelect";
import { ExpandToggle, sheetId } from "@/components/admin/orders/ExpandToggle";
import { OrderSheet } from "@/components/admin/orders/OrderSheet";
import { canApproveOrder, canShipOrder, useOrderActions, type OrderPatch } from "@/components/admin/orders/useOrderActions";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ADMIN_PAGE_SIZE, adminListOrders } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney } from "@/lib/format";
import { orderNetTotal } from "@/lib/ordersApi";
import type { AdminOrder, OrderStatus } from "@/types";

/** "Tümü" first: the admin's usual entry point is the whole list. */
const FILTERS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: "Tümü" },
  { value: "AWAITING_TRANSFER", label: "Havale bekleyen" },
  { value: "PENDING_APPROVAL", label: "Onay bekleyen" },
  { value: "APPROVED", label: "Onaylanan" },
  { value: "SHIPPED", label: "Kargoda" },
  { value: "CANCELLED", label: "İptal" },
];

interface ListState {
  key: string;
  orders: AdminOrder[];
  error: string | null;
  hasMore: boolean;
}

function PaymentLabel({ method }: { method: AdminOrder["payment_method"] }) {
  const bank = method === "BANK_TRANSFER";
  const Icon = bank ? Landmark : CreditCard;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-600 dark:text-zinc-400">
      <Icon className="h-4 w-4" aria-hidden />
      {bank ? "Havale / EFT" : "Kredi kartı"}
    </span>
  );
}

/** Courier orders must leave the warehouse the same day: make them impossible to miss. */
/** The shop's own İstanbul run: loaded on the van, not handed to a carrier. */
function IstanbulFlag() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white">
      <Van className="h-3 w-3" aria-hidden /> İstanbul içi · hemen gönder
    </span>
  );
}

function AddressLine({ order }: { order: AdminOrder }) {
  const a = order.shipping_address;
  if (!a) return null;
  return (
    <p
      className="mt-1 truncate text-xs text-slate-500 dark:text-zinc-500"
      title={`${a.line}, ${[a.district, a.city].filter(Boolean).join(" / ")} · ${a.phone}`}
    >
      {[a.district, a.city].filter(Boolean).join(" / ")} · {a.phone}
    </p>
  );
}

/**
 * The order management panel. It lives inside Genel Bakış as a sub-view (there is
 * no standalone /admin/orders route), so its heading is an h2 under the
 * dashboard's h1 and `onClose` takes the admin back to the overview.
 */
export function AdminOrdersView({ onClose }: { onClose?: () => void }) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [istanbulOnly, setIstanbulOnly] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [list, setList] = useState<ListState | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const shippingMethod = istanbulOnly ? ("ISTANBUL_FREE" as const) : null;
  const key = `${status ?? "ALL"}:${istanbulOnly}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    adminListOrders({ status, shippingMethod }, controller.signal)
      .then((orders) => setList({ key, orders, error: null, hasMore: orders.length === ADMIN_PAGE_SIZE }))
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setList({ key, orders: [], error: getApiErrorMessage(err, "Siparişler yüklenemedi."), hasMore: false });
      });
    return () => controller.abort();
  }, [key, status, shippingMethod]);

  const current = list?.key === key ? list : null;

  const patch = useCallback<OrderPatch>((id, changes) => {
    setList((prev) =>
      prev ? { ...prev, orders: prev.orders.map((o) => (o.id === id ? { ...o, ...changes } : o)) } : prev,
    );
  }, []);
  const actions = useOrderActions(patch);

  const toggle = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  async function loadMore() {
    if (!current || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await adminListOrders({ status, shippingMethod, skip: current.orders.length });
      setList((prev) =>
        prev && prev.key === key
          ? { ...prev, orders: [...prev.orders, ...next], hasMore: next.length === ADMIN_PAGE_SIZE }
          : prev,
      );
    } catch (err) {
      setList((prev) => (prev ? { ...prev, error: getApiErrorMessage(err, "Siparişler yüklenemedi.") } : prev));
    } finally {
      setLoadingMore(false);
    }
  }

  /** Quick actions on the row itself, so a queue can be cleared without expanding. */
  const renderAction = (order: AdminOrder) => {
    const notice = actions.notice(order.id);
    if (canApproveOrder(order.status)) {
      const transfer = order.status === "AWAITING_TRANSFER";
      return (
        // Stacked and compact: side by side they overflowed the cell and ran into
        // the Durum column.
        <div className="flex w-full flex-col items-stretch gap-1">
          <Button
            type="button"
            onClick={() => actions.approve(order)}
            loading={actions.busy(order.id)}
            className="h-8! px-2.5! text-xs!"
            title={transfer ? "Havale hesaba geçti: siparişi ödendi olarak işaretle" : "Siparişi onayla"}
          >
            <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden /> {transfer ? "Ödendi" : "Onayla"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => actions.cancel(order)}
            disabled={actions.busy(order.id)}
            className="h-8! px-2.5! text-xs!"
          >
            <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> İptal et
          </Button>
          {notice?.kind === "error" && (
            <p className="whitespace-normal text-left text-[11px] leading-4 text-red-600 dark:text-red-400">{notice.text}</p>
          )}
        </div>
      );
    }
    // Approved and still here: the same two cargo decisions as the dashboard's
    // KARGO column, so the "Onaylanan" filter is a working dispatch queue.
    if (canShipOrder(order.status)) {
      return (
        <div className="flex flex-col items-stretch gap-1">
          <CargoSelect order={order} actions={actions} />
          {notice && (
            <p
              role="status"
              className={`whitespace-normal text-left text-[11px] leading-4 ${
                notice.kind === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {notice.text}
            </p>
          )}
        </div>
      );
    }
    return notice?.kind === "success" ? (
      <p className="whitespace-normal text-left text-[11px] font-medium leading-4 text-emerald-600 dark:text-emerald-400" role="status">
        {notice.text}
      </p>
    ) : null;
  };

  const sheetFor = (order: AdminOrder) => (
    <OrderSheet
      order={order}
      busy={actions.busy(order.id)}
      notice={actions.notice(order.id)}
      onApprove={() => actions.approve(order)}
      onCancel={() => actions.cancel(order)}
    />
  );

  return (
    <section aria-labelledby="orders-heading">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="orders-heading" className="text-2xl font-semibold tracking-tight">
            Sipariş Yönetimi
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-zinc-400">
            Havalesi hesaba geçen siparişleri “Ödendi” ile onaylayın (ParaPuan/Kumbarapuan o an tanımlanır) veya gerekçeyle
            iptal edin; iptal stoğu ve kullanılan puanları iade eder. Kurye siparişleri aynı gün çıkmalıdır.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="inline-flex h-9 items-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            <RefreshCw className="h-4 w-4" aria-hidden /> Yenile
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <X className="h-4 w-4" aria-hidden /> Kapat
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Sipariş durumu" className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {FILTERS.map((f) => {
            const active = f.value === status;
            return (
              <button
                key={f.label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(f.value)}
                className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "bg-red-600 text-white shadow-sm shadow-red-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
          <input type="checkbox" checked={istanbulOnly} onChange={(e) => setIstanbulOnly(e.target.checked)} className="accent-sky-600" />
          <Van className="h-4 w-4" aria-hidden /> Sadece İstanbul içi
        </label>
      </div>

      <div className={panelClass}>
        {!current ? (
          <div className="space-y-2 p-4" aria-busy>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" />
            ))}
          </div>
        ) : current.orders.length === 0 && current.error ? (
          <div className="p-4">
            <Alert variant="error">{current.error}</Alert>
          </div>
        ) : current.orders.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-slate-500 dark:text-zinc-400">Bu durumda sipariş yok.</p>
        ) : (
          <>
            {/*
              Desktop table, sized to its container — no horizontal scroll.
              `table-fixed` with percentage columns keeps the badge and the action
              buttons inside their own cells (side by side they used to spill into
              the Durum column), and the text cells truncate instead of widening.
              "Ödeme" folds into the amount cell below xl, where the panel is narrower.
            */}
            <div className="hidden md:block">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-zinc-500">
                  <th scope="col" className="w-9 px-2 py-3">
                    <span className="sr-only">Detay</span>
                  </th>
                  <th scope="col" className="w-[20%] px-3 py-3">Sipariş</th>
                  <th scope="col" className="w-[25%] px-3 py-3">Müşteri</th>
                  <th scope="col" className="hidden w-[11%] px-3 py-3 xl:table-cell">Ödeme</th>
                  <th scope="col" className="w-[12%] px-3 py-3 text-right">Tutar</th>
                  <th scope="col" className="w-[16%] px-3 py-3">Durum</th>
                  <th scope="col" className="w-[16%] px-3 py-3 text-right">
                    <span className="sr-only">İşlem</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {current.orders.map((o) => {
                  const expanded = open.has(o.id);
                  return (
                    <Fragment key={o.id}>
                      <tr
                        className={`transition-colors ${
                          o.shipping_method === "ISTANBUL_FREE"
                            ? "bg-sky-50/70 hover:bg-sky-50 dark:bg-sky-500/5"
                            : "hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        <td className="px-2 py-3 align-top">
                          <ExpandToggle
                            expanded={expanded}
                            onToggle={() => toggle(o.id)}
                            controls={sheetId(o.id)}
                            orderNumber={o.order_number}
                          />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="truncate font-mono text-xs font-semibold" title={o.order_number}>{o.order_number}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-zinc-500">{formatDate(o.created_at)}</p>
                          {o.shipping_method === "ISTANBUL_FREE" && (
                            <div className="mt-1.5 flex">
                              <IstanbulFlag />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="truncate font-medium">{o.customer_name || o.shipping_address?.full_name || "—"}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-zinc-500" title={o.customer_email}>{o.customer_email}</p>
                          <AddressLine order={o} />
                        </td>
                        <td className="hidden px-3 py-3 align-top xl:table-cell">
                          <PaymentLabel method={o.payment_method} />
                        </td>
                        <td className="px-3 py-3 text-right align-top font-semibold tabular-nums">
                          {formatMoney(orderNetTotal(o))}
                          <p className="text-xs font-normal text-slate-500 dark:text-zinc-500">
                            {o.items.reduce((n, i) => n + i.quantity, 0)} ürün
                          </p>
                          <p className="text-xs font-normal text-slate-500 xl:hidden dark:text-zinc-500">
                            {o.payment_method === "BANK_TRANSFER" ? "Havale" : "Kart"}
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <StatusBadge status={o.status} compact />
                          {o.cancel_reason && (
                            <p className="mt-1 max-w-32 truncate text-xs text-slate-500" title={o.cancel_reason}>
                              {o.cancel_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">{renderAction(o)}</td>
                      </tr>
                      {expanded && (
                        <tr id={sheetId(o.id)}>
                          <td colSpan={7} className="p-0">
                            {sheetFor(o)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden dark:divide-white/5">
              {current.orders.map((o) => {
                const expanded = open.has(o.id);
                return (
                  <li key={o.id}>
                    <div className={`space-y-3 p-4 ${o.shipping_method === "ISTANBUL_FREE" ? "bg-sky-50/70 dark:bg-sky-500/5" : ""}`}>
                      {o.shipping_method === "ISTANBUL_FREE" && <IstanbulFlag />}
                      <div className="flex items-start gap-2">
                        <ExpandToggle
                          expanded={expanded}
                          onToggle={() => toggle(o.id)}
                          controls={sheetId(o.id)}
                          orderNumber={o.order_number}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs font-semibold">{o.order_number}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-zinc-500">
                            {o.customer_name || o.customer_email} · {formatDate(o.created_at)}
                          </p>
                          <AddressLine order={o} />
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <PaymentLabel method={o.payment_method} />
                        <span className="font-semibold tabular-nums">{formatMoney(orderNetTotal(o))}</span>
                      </div>
                      {renderAction(o)}
                    </div>
                    {expanded && <div id={sheetId(o.id)}>{sheetFor(o)}</div>}
                  </li>
                );
              })}
            </ul>

            {current.error && (
              <div className="border-t border-slate-200 p-4 dark:border-white/10">
                <Alert variant="error">{current.error}</Alert>
              </div>
            )}
            {current.hasMore && (
              <div className="border-t border-slate-200 p-4 dark:border-white/10">
                <Button type="button" variant="secondary" onClick={loadMore} loading={loadingMore} className="sm:mx-auto sm:w-60!">
                  Daha fazla yükle
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
