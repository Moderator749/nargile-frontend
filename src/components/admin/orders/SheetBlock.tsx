import type { ReactNode } from "react";

import { CopyButton } from "@/components/admin/orders/CopyButton";

/** One bordered box of the order form, with its uppercase caption bar. */
export function SheetBlock({
  title,
  children,
  className = "",
  print = true,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  /** False: on screen only, left off YAZDIR's printed sheet. */
  print?: boolean;
}) {
  return (
    <section
      data-print-hide={print ? undefined : ""}
      className={`flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/15 dark:bg-zinc-900 ${className}`}
    >
      <h4 className="border-b border-slate-300 bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-200">
        {title}
      </h4>
      {children}
    </section>
  );
}

/** `ETİKET  değer` row of a block's definition list; empty values print an em dash. */
export function SheetField({
  label,
  value,
  mono = false,
  print = true,
  copy,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  /** False: on screen only, left off YAZDIR's printed sheet. */
  print?: boolean;
  /** The text a copy button beside the value puts on the clipboard; none when absent or empty. */
  copy?: string | null;
}) {
  return (
    <div
      data-print-hide={print ? undefined : ""}
      className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-baseline gap-2 border-b border-dashed border-slate-200 px-3 py-1.5 last:border-b-0 print:grid-cols-[6rem_minmax(0,1fr)] dark:border-white/10"
    >
      <dt className="text-[10px] font-semibold uppercase leading-4 tracking-wide text-slate-500 dark:text-zinc-400">{label}</dt>
      <dd className={`flex min-w-0 items-start justify-between gap-1.5 text-sm leading-5 ${mono ? "font-mono text-xs" : ""}`}>
        <span className="min-w-0 break-words">{value || "—"}</span>
        {copy && <CopyButton text={copy} label={label} />}
      </dd>
    </div>
  );
}

/** Column headers of the sheet's two tables. */
export const sheetTheadClass =
  "border-b border-slate-300 bg-slate-100 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-300";
