import { useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
}

/** A labelled dropdown, sized and styled to sit in a row with `Input`. */
export function Select({ label, hint, id, className = "", children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          id={selectId}
          aria-describedby={hintId}
          className={`block h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pe-9 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:bg-slate-100 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-white/5 ${className}`}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-slate-400 dark:text-zinc-500"
          aria-hidden
        />
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  );
}
