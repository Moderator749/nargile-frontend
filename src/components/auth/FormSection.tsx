import type { ReactNode } from "react";

/**
 * One group of the sign-up form: a legend, an optional line of explanation, and
 * the fields. A `<fieldset>` rather than a `<div>` so screen readers announce
 * which group a field belongs to — on a form this long, "Vergi Dairesi" alone
 * is not enough to place it.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-white/10 sm:p-5">
      <legend className="px-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
        {title}
      </legend>
      {description && <p className="mb-4 text-xs text-slate-500 dark:text-zinc-400">{description}</p>}
      {children}
    </fieldset>
  );
}

/**
 * The radio-card look shared by the firm type, account kind and segment
 * pickers.
 *
 * Once a choice is made the others are dimmed, so which one is live is obvious
 * at a glance rather than a matter of comparing two borders. Dimmed, not
 * disabled: the opacity comes back on hover and the cursor stays a pointer, so
 * nothing looks unavailable — that look belongs to `disabled`, which keeps the
 * not-allowed cursor.
 */
export function radioCardClass(selected: boolean, disabled = false): string {
  const base =
    "flex gap-3 rounded-lg border p-3 text-sm transition-[color,background-color,border-color,opacity] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40";
  if (disabled) return `${base} cursor-not-allowed border-slate-200 opacity-60 dark:border-white/10`;
  return selected
    ? `${base} cursor-pointer border-red-600 bg-red-50/60 ring-1 ring-red-600 dark:border-red-400 dark:bg-red-500/10 dark:ring-red-400`
    : `${base} cursor-pointer border-slate-200 bg-slate-50 opacity-70 hover:border-slate-400 hover:opacity-100 has-[:focus-visible]:opacity-100 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/25`;
}
