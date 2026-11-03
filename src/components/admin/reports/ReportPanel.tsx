import type { ReactNode } from "react";

import { panelClass } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";

/** One report: its heading and note, its own options, and its table or chart. */
export function ReportPanel({
  id,
  title,
  description,
  controls,
  actions,
  error,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  controls?: ReactNode;
  actions?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className={`${panelClass} overflow-hidden`}>
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-white/10">
        <div className="min-w-0">
          <h3 id={`${id}-heading`} className="text-base font-semibold tracking-tight">
            {title}
          </h3>
          {description && <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{description}</p>}
        </div>
        {actions}
      </header>
      {controls && <div className="flex flex-wrap items-center gap-2 px-5 pt-4">{controls}</div>}
      {error && (
        <div className="px-5 pt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {children}
    </section>
  );
}
