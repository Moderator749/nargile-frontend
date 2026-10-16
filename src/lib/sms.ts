/**
 * How many SMS a text costs: GSM 03.38 7-bit, or UCS-2 as soon as one
 * character falls outside it (ğ, ı, ş, İ do). Mirrors
 * saas_backend/app/services/notify/sms_segments.py.
 */
const GSM_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\u001bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
);
const GSM_EXTENDED = new Set("^{}\\[~]|€\f");

export interface SmsParts {
  encoding: "GSM-7" | "UCS-2";
  /** Characters as billed: GSM extension characters count twice. */
  units: number;
  /** Number of SMS. */
  parts: number;
  /** Characters left in the last part. */
  remaining: number;
  /** Characters that force UCS-2, for the hint. */
  nonGsm: string[];
}

export function smsParts(text: string): SmsParts {
  const chars = Array.from(text);
  const nonGsm = [...new Set(chars.filter((c) => !GSM_BASIC.has(c) && !GSM_EXTENDED.has(c)))];
  const gsm = nonGsm.length === 0;
  // UTF-16 code units: an emoji takes two.
  const units = gsm ? chars.reduce((n, c) => n + (GSM_EXTENDED.has(c) ? 2 : 1), 0) : text.length;
  const [single, multi] = gsm ? [160, 153] : [70, 67];
  const parts = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi);
  const capacity = parts <= 1 ? single : parts * multi;
  return { encoding: gsm ? "GSM-7" : "UCS-2", units, parts, remaining: capacity - units, nonGsm };
}
