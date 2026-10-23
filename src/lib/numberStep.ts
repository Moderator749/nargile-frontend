/**
 * ↑/↓ in a number typed into a text field, as a number input steps: the
 * admin's price and rate fields are text (`inputMode="decimal"`) so that
 * "12,5" can be typed, and a text field does not step by itself.
 *
 * No path aliases here: `npm test` imports this file as it is.
 */

/** Decimal places a step of this size needs (0.1 → 1). */
const placesOf = (n: number) => (String(n).split(".")[1] ?? "").length;

/**
 * `value` moved by `delta`, written as it was: a decimal comma stays a comma
 * ("12,5" → "13,5"), as many decimals as it had (or the step needs), the
 * thousands dots of "1.234,5" dropped. Never below zero from zero or above,
 * unless `negative` (a points adjustment). Null when the field holds
 * something that is not a number: it stays as it is.
 */
export function steppedValue(value: string, delta: number, negative = false): string | null {
  const text = value.trim();
  const comma = text.includes(",");
  const plain = comma ? text.replace(/\./g, "").replace(",", ".") : text;
  if (plain !== "" && !/^-?\d*\.?\d*$/.test(plain)) return null;
  const n = plain === "" || plain === "-" || plain === "." ? 0 : Number(plain);
  if (!Number.isFinite(n)) return null;
  const places = Math.max((plain.split(".")[1] ?? "").length, placesOf(Math.abs(delta)));
  let next = n + delta;
  if (!negative && n >= 0 && next < 0) next = 0;
  const out = next.toFixed(places);
  return comma ? out.replace(".", ",") : out;
}

/** How far one press moves: 1, ×10 with Shift, 0.1 with Alt (Option). */
export function stepSize(key: string, shift: boolean, alt: boolean): number | null {
  const sign = key === "ArrowUp" ? 1 : key === "ArrowDown" ? -1 : 0;
  if (!sign) return null;
  return sign * (shift ? 10 : alt ? 0.1 : 1);
}

/** What `stepOnArrowKey` reads of a keydown on a text input (React's KeyboardEvent has it all). */
export interface StepKeyEvent {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
  currentTarget: { value: string; readOnly: boolean; disabled: boolean };
  preventDefault(): void;
}

/**
 * A number field's onKeyDown: ↑/↓ step its value (Shift ×10, Alt 0.1) and
 * hand the new text to `onValue` — the field's own onChange path, so
 * everything typing updates (a paired KDV-dahil price, a total) follows.
 * ←/→ and every other key are left alone: the caret moves as in any field.
 * `integer`: whole numbers only (a stock, a count), Alt steps by one too.
 * `negative`: may go below zero (a points adjustment).
 */
export function stepOnArrowKey(
  event: StepKeyEvent,
  onValue: (value: string) => void,
  options: { integer?: boolean; negative?: boolean } = {},
): void {
  const field = event.currentTarget;
  if (event.defaultPrevented || field.readOnly || field.disabled) return;
  const delta = stepSize(event.key, event.shiftKey, !options.integer && event.altKey);
  if (delta === null) return;
  const next = steppedValue(field.value, delta, options.negative);
  if (next === null) return;
  event.preventDefault();
  onValue(next);
}

