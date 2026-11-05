import { AlertCircle, Info } from "lucide-react";

/**
 * What goes under a field: its error, else a warning, else its hint — one at a
 * time, in the same place, so the field never grows two lines of small print.
 * `describedBy` is the id list the field points `aria-describedby` at.
 */
export function fieldMessage(fieldId: string, { error, warning, hint }: { error?: string; warning?: string; hint?: string }) {
  const id = `${fieldId}-message`;
  if (error) {
    return {
      describedBy: id,
      node: (
        <p id={id} className="flex items-start gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ),
    };
  }
  if (warning) {
    return {
      describedBy: id,
      node: (
        // Polite: it says what the field just did to their typing, not that
        // anything is wrong.
        <p id={id} role="status" className="flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{warning}</span>
        </p>
      ),
    };
  }
  if (hint) {
    return {
      describedBy: id,
      node: (
        <p id={id} className="text-xs text-slate-500 dark:text-zinc-400">
          {hint}
        </p>
      ),
    };
  }
  return { describedBy: undefined, node: null };
}

/** The border a field wears while it has an error. */
export const INVALID_FIELD =
  "border-red-500 ring-1 ring-red-500/40 focus:border-red-500 focus:ring-2 focus:ring-red-500/25 dark:border-red-400/80 dark:ring-red-400/30";
export const VALID_FIELD = "border-slate-300 dark:border-white/15 focus:border-red-500 focus:ring-red-500/20";
