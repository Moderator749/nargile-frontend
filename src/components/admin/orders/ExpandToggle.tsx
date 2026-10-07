import { ChevronRight } from "lucide-react";

/** The `>` that opens an order's detail sheet under its row. */
export function ExpandToggle({
  expanded,
  onToggle,
  controls,
  orderNumber,
}: {
  expanded: boolean;
  onToggle: () => void;
  controls: string;
  orderNumber: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={`${orderNumber} sipariş detayını ${expanded ? "kapat" : "aç"}`}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors duration-200 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
    >
      <ChevronRight
        className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`}
        aria-hidden
      />
    </button>
  );
}

/** Row ids the toggle points at, so both views label their sheets the same way. */
export function sheetId(orderId: string): string {
  return `order-sheet-${orderId}`;
}
