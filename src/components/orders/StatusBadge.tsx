"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { ordersMessages } from "@/lib/i18n/messages/orders";
import type { OrderStatus } from "@/types";

// Green = approved, red = cancelled; pending states are orange/amber (they need action).
// Solid enough to read on the admin's grey and yellow order rows.
// The labels are Turkish, as the admin panel reads them; the badge itself says
// them in the page's language (`ordersMessages.status`).
export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_APPROVAL: {
    label: "Onay bekliyor",
    className: "bg-orange-100 text-orange-800 ring-orange-300 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-500/40",
  },
  AWAITING_TRANSFER: {
    label: "Havale bekliyor",
    // Deeper than the havale rows' yellow, so it still stands out on them.
    className: "bg-amber-200 text-amber-900 ring-amber-400 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-500/50",
  },
  AWAITING_PAYMENT: {
    label: "Ödeme bekliyor",
    className: "bg-sky-100 text-sky-800 ring-sky-300 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-500/40",
  },
  APPROVED: {
    label: "Onaylandı",
    className:
      "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/40",
  },
  SHIPPED: {
    label: "Kargoya verildi",
    className: "bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-zinc-900 dark:ring-white",
  },
  CANCELLED: {
    label: "İptal edildi",
    className: "bg-red-100 text-red-800 ring-red-300 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-500/40",
  },
  PAYMENT_FAILED: {
    label: "Ödeme başarısız",
    className: "bg-zinc-100 text-zinc-700 ring-zinc-300 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/20",
  },
};

/** `compact` is for the dense admin tables, where a full-size pill does not fit. */
export function StatusBadge({ status, compact = false }: { status: OrderStatus; compact?: boolean }) {
  const s = ORDER_STATUS[status];
  const label = useMessages(ordersMessages).status[status];
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center rounded-full font-semibold ring-1 ring-inset ${
        compact
          ? "px-2 py-0.5 text-center text-[11px] leading-4 whitespace-normal sm:whitespace-nowrap"
          : "whitespace-nowrap px-2.5 py-1 text-xs"
      } ${s.className}`}
    >
      {label}
    </span>
  );
}
