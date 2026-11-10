"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellRing, VolumeX, X } from "lucide-react";

import { adminLatestOrders } from "@/lib/adminApi";
import { playChime, unlockChime } from "@/lib/chime";
import {
  CHIMED_KEY,
  CURSOR_KEY,
  POLL_EVERY,
  alertText,
  lira,
  remember,
  startCursor,
  unseen,
  type PlacedOrder,
} from "@/lib/orderAlerts";
import { orderHref } from "@/lib/teamLinks";

/** How long a toast stays when nobody closes it. */
const TOAST_FOR = 2 * 60_000;
/** Toasts on screen at once; an older one makes way. */
const MAX_TOASTS = 4;

interface Toast {
  order: PlacedOrder;
  /** The chime could not play: the browser is waiting for a first click. */
  muted: boolean;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or storage off: this tab's memory still keeps it to one chime.
  }
}

function chimedIds(): string[] {
  try {
    const ids = JSON.parse(read(CHIMED_KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * The new-order chime: while an admin has the panel open, every order placed
 * rings a soft bell and shows a toast ("Yeni Sipariş! #… - … TL - …") that
 * leads to the order.
 *
 * It polls /admin/orders/latest every POLL_EVERY — a hidden tab as often as
 * the browser allows, so an admin working in another tab still hears it. Each
 * tab shows its own toast; the bell rings once per order across the tabs (the
 * ids it rang for are kept in localStorage, and so is the cursor, so a reload
 * misses nothing and repeats nothing). Until the page has had a click the browser keeps audio off:
 * the toast then says so.
 */
export function OrderAlerts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const shown = useRef(new Set<string>());

  const dismiss = useCallback((id: string) => setToasts((list) => list.filter((t) => t.order.id !== id)), []);

  // Once audio is allowed, the toasts' "click once" hint has done its job.
  useEffect(() => unlockChime(() => setToasts((list) => list.map((t) => ({ ...t, muted: false })))), []);

  useEffect(() => {
    let cursor = startCursor(read(CURSOR_KEY), Date.now());
    let controller: AbortController | null = null;
    let stopped = false;
    // The first answer may hold orders announced before this tab opened (a
    // reload, within the cursor's overlap): those are not news here.
    let first = true;

    const poll = async () => {
      if (controller) return; // the previous poll is still out
      controller = new AbortController();
      try {
        const { now, orders } = await adminLatestOrders(cursor, controller.signal);
        cursor = now;
        write(CURSOR_KEY, now);
        const rung = chimedIds();
        if (first) {
          first = false;
          orders.filter((o) => rung.includes(o.id)).forEach((o) => shown.current.add(o.id));
        }
        const fresh = unseen(orders, shown.current);
        if (!fresh.length || stopped) return;
        fresh.forEach((o) => shown.current.add(o.id));

        const toRing = fresh.filter((o) => !rung.includes(o.id));
        let muted = false;
        if (toRing.length) {
          write(CHIMED_KEY, JSON.stringify(remember(rung, toRing.map((o) => o.id))));
          muted = !playChime();
        }
        // Newest on top.
        setToasts((list) => [...fresh.reverse().map((order) => ({ order, muted })), ...list].slice(0, MAX_TOASTS));
        for (const o of fresh) setTimeout(() => dismiss(o.id), TOAST_FOR);
      } catch {
        // Offline, signed out or a hiccup: the next poll tries again from the same cursor.
      } finally {
        controller = null;
      }
    };

    void poll();
    const timer = setInterval(poll, POLL_EVERY);
    const onShow = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
      controller?.abort();
    };
  }, [dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-[calc(var(--header-height,4rem)+1rem)] z-50 flex flex-col items-end gap-3 sm:left-auto sm:w-96"
    >
      {toasts.map(({ order, muted }) => (
        <div
          key={order.id}
          className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-lg shadow-emerald-900/10 motion-safe:animate-[order-toast-in_250ms_ease-out] dark:border-emerald-500/30 dark:bg-zinc-900 dark:shadow-black/40"
        >
          <Link
            href={orderHref(order.order_number)}
            onClick={() => dismiss(order.id)}
            className="flex gap-3 p-4 pr-11 transition-colors duration-200 hover:bg-emerald-50/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-600 dark:hover:bg-emerald-500/5"
          >
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <BellRing className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="sr-only">{alertText(order)}</span>
              <span aria-hidden className="block text-sm font-semibold text-slate-900 dark:text-white">
                Yeni Sipariş!
              </span>
              <span aria-hidden className="mt-0.5 block truncate font-mono text-xs text-slate-600 dark:text-zinc-300">
                #{order.order_number}
              </span>
              <span aria-hidden className="mt-1 block text-sm text-slate-700 dark:text-zinc-200">
                <span className="font-semibold tabular-nums">{lira(order.total_amount)}</span>
                <span className="text-slate-400 dark:text-zinc-500"> · </span>
                {order.customer_name}
              </span>
              {muted && (
                <span className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <VolumeX className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Sesli bildirim için sayfaya bir kez tıklayın.
                </span>
              )}
              <span className="mt-2 block text-xs font-medium text-emerald-700 dark:text-emerald-400">Siparişi aç →</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => dismiss(order.id)}
            aria-label="Bildirimi kapat"
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:hover:bg-white/5 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
