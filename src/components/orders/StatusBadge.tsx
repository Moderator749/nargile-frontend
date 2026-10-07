import type { OrderStatus } from "@/types";

// Green = approved, red = cancelled; pending states are orange/amber (they need action).
// Solid enough to read on the admin's grey and yellow order rows.
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
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.className}`}
    >
      {s.label}
    </span>
  );
}
