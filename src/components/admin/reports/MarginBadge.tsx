import { AlertTriangle } from "lucide-react";

import { DASH, formatPercent, marginLevel } from "@/lib/reportFormat";
import type { DecimalString } from "@/types";

const STYLES = {
  low: "bg-red-600 text-white dark:bg-red-500",
  near: "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30",
  ok: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25",
} as const;

/**
 * A margin, coloured against the threshold: red under it ("Marj Erozyonu"),
 * amber within five points above it, green otherwise.
 */
export function MarginBadge({
  value,
  threshold,
  prefix,
}: {
  value: DecimalString | null | undefined;
  threshold: number;
  /** A word before the figure, e.g. "Havale". */
  prefix?: string;
}) {
  const level = marginLevel(value, threshold);
  if (!level) return <span className="text-slate-400 dark:text-zinc-500">{DASH}</span>;
  return (
    <span
      title={level === "low" ? `Marj erozyonu: %${threshold} eşiğinin altında` : undefined}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${STYLES[level]}`}
    >
      {level === "low" && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
      {prefix && <span className="font-sans font-medium">{prefix}</span>}
      {formatPercent(value)}
      {level === "low" && <span className="sr-only"> — marj erozyonu</span>}
    </span>
  );
}
