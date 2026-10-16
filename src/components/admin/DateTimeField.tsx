import { X } from "lucide-react";

const fieldClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:[color-scheme:dark]";

/** A `datetime-local` input with its label, a clear button and a hint. */
export function DateTimeField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
}) {
  return (
    // min-w-0 here and on the input: a datetime-local box has a wide built-in
    // minimum, and without them it pushes its clear button into the next column.
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="mt-2 flex min-w-0 gap-2">
        <input
          id={id}
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={`${id}-hint`}
          className={`${fieldClass} h-11 min-w-0 flex-1`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={`${label} alanını temizle`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-white/15 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
        {hint}
      </p>
    </div>
  );
}
