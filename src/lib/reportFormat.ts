import type { DecimalString } from "@/types";

/**
 * Raporlar's numbers as the shop writes them: the percent sign first, a
 * decimal comma ("%44,8"), and a change signed and named ("+%12,3",
 * "−2,1 puan"). An absent figure is a dash, never 0.
 */

const ONE_DECIMAL = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const WHOLE = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
/** U+2212: a minus that is as wide as the plus. */
const MINUS = "−";
export const DASH = "—";

export function formatPercent(value: DecimalString | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return DASH;
  const n = Number(value);
  return n < 0 ? `${MINUS}%${ONE_DECIMAL.format(-n)}` : `%${ONE_DECIMAL.format(n)}`;
}

export function formatCount(value: number): string {
  return WHOLE.format(value);
}

export type Trend = "up" | "down" | "flat";

export function trendOf(value: DecimalString | number | null | undefined): Trend | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return n > 0 ? "up" : n < 0 ? "down" : "flat";
}

/** "+%12,3" against the period before; null when there was nothing to compare with. */
export function formatChange(value: DecimalString | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  const sign = n > 0 ? "+" : n < 0 ? MINUS : "±";
  return `${sign}%${ONE_DECIMAL.format(Math.abs(n))}`;
}

/** "+2,1 puan": a margin moves in percentage points, not percent. */
export function formatPoints(value: DecimalString | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  const sign = n > 0 ? "+" : n < 0 ? MINUS : "±";
  return `${sign}${ONE_DECIMAL.format(Math.abs(n))} puan`;
}

export type MarginLevel = "low" | "near" | "ok";

/** Under the threshold, within five points above it, or comfortably over. */
export function marginLevel(value: DecimalString | number | null | undefined, threshold: number): MarginLevel | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (n < threshold) return "low";
  return n < threshold + 5 ? "near" : "ok";
}
