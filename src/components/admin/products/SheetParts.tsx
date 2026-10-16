import type { ReactNode } from "react";

/** One bordered block of the sheet, with its caption bar. */
export function SheetSection({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-white/15 dark:bg-zinc-900 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-300 bg-slate-100 px-4 py-2.5 dark:border-white/15 dark:bg-white/[0.06]">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-zinc-200">{title}</h2>
        {hint && <p className="text-[11px] text-slate-500 dark:text-zinc-400">{hint}</p>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export const sheetInputClass =
  "block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:bg-slate-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-white/5";

export const sheetLabelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400";

/** Labelled field; `id` ties the label to the control for screen readers. */
export function SheetField({
  id,
  label,
  hint,
  children,
  className = "",
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* The id lets a control that is not a form element (the rich-text
          editor) name itself after the label with aria-labelledby. */}
      <label id={`${id}-label`} htmlFor={id} className={sheetLabelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}
