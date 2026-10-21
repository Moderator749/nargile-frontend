import axios from "axios";

import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { apiErrorMessages } from "@/lib/i18n/messages/auth";
import type { ApiError } from "@/types";

/**
 * The language to answer in: the one given, else the page's own (the root
 * layout writes it on <html lang>), else Turkish — on the server, and on the
 * admin panel, which is always Turkish.
 */
function resolveLocale(locale?: Locale): Locale {
  if (locale) return locale;
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang;
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}

// Checkout engine errors carry details (SKU, quantities); match and translate them.
type Words = (typeof apiErrorMessages)[Locale];
const PATTERNS: [RegExp, (m: RegExpMatchArray, t: Words) => string][] = [
  [/^Insufficient stock for (\S+): requested (\d+), available (\d+)/, (m, t) => t.insufficientStock(m[1], m[2], m[3])],
  [/^No TRY price for variant (\S+)/, (m, t) => t.notForSale(m[1])],
  [/^Order cannot be approved — current status is (\w+)/, (m, t) => t.cannotApprove(m[1])],
  [/^Variant \S+ not found/, (_m, t) => t.variantGone],
];

/**
 * A backend `detail` string the customer can see, in the page's language;
 * one it does not know is shown as it came. Turkish details are left as they
 * are in Turkish.
 */
export function translateApiDetail(detail: string, locale?: Locale): string {
  const t = apiErrorMessages[resolveLocale(locale)];
  if (Object.hasOwn(t.known, detail)) return t.known[detail];
  for (const [pattern, render] of PATTERNS) {
    const m = detail.match(pattern);
    if (m) return render(m, t);
  }
  return detail;
}

/** Turns an API failure into a short, user-facing message in the page's language (Turkish by default). */
export function getApiErrorMessage(error: unknown, fallback: string, locale?: Locale): string {
  if (!axios.isAxiosError<ApiError>(error)) return fallback;
  const lang = resolveLocale(locale);
  const t = apiErrorMessages[lang];

  if (!error.response) return t.unreachable;

  const detail = error.response.data?.detail;
  if (typeof detail === "string") return translateApiDetail(detail, lang);
  if (Array.isArray(detail) && detail.length > 0) return t.checkInput;
  if (error.response.status >= 500) return t.serverError;
  return fallback;
}
