import { useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { INVALID_FIELD, VALID_FIELD, fieldMessage } from "@/components/ui/FieldMessage";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  /** Shown in red under the field, which turns red too. */
  error?: string;
}

/** A labelled dropdown, sized and styled to sit in a row with `Input`. */
export function Select({ label, hint, error, id, className = "", children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const message = fieldMessage(selectId, { error, hint });

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          id={selectId}
          aria-describedby={message.describedBy}
          aria-invalid={error ? true : undefined}
          data-invalid={error ? "" : undefined}
          className={`block h-11 w-full appearance-none rounded-lg border bg-white px-3 pe-9 text-sm text-slate-900 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 ${error ? INVALID_FIELD : VALID_FIELD} disabled:bg-slate-100 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-white/5 ${className}`}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-slate-400 dark:text-zinc-500"
          aria-hidden
        />
      </div>
      {message.node}
    </div>
  );
}
