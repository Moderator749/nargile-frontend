import { AlertTriangle } from "lucide-react";

import { EXPORT_NOTICE } from "@/lib/exportAccount";

/**
 * The same terms the account was shown at sign-in, at the top of its cart.
 *
 * Repeated rather than linked: this is the page where the consequences land —
 * no payment step, a request instead of an order — and the customer should not
 * have to remember a modal from an hour ago to understand what the button at
 * the bottom does.
 */
export function ExportRequestNotice() {
  return (
    <aside
      aria-label="Export order terms"
      className="flex gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 sm:p-5 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} aria-hidden />
      <div className="space-y-2">
        <p className="text-sm font-bold">Important notice</p>
        {EXPORT_NOTICE.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-[13px]">
            {paragraph}
          </p>
        ))}
      </div>
    </aside>
  );
}
