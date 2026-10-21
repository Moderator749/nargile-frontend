/**
 * Per-area message sets: each part of the storefront (cart, account, product…)
 * keeps its words in its own module under ./messages, Turkish first:
 *
 *   export const cartMessages = defineMessages({
 *     tr: { title: "Sepetim", items: (n: number) => `${n} ürün` },
 *     en: { title: "Your Cart", items: (n: number) => `${n} ${n === 1 ? "item" : "items"}` },
 *     ar: { title: "سلة التسوق", items: (n: number) => `${n} منتج` },
 *   });
 *
 * English and Arabic must have exactly Turkish's keys (a type error
 * otherwise). Read them with `useMessages(cartMessages)` in a client
 * component, `await getMessages(cartMessages)` on the server.
 */

import type { Locale } from "@/lib/i18n/config";

export type Messages<T> = Record<Locale, T>;

export function defineMessages<T>(messages: { tr: T; en: NoInfer<T>; ar: NoInfer<T> }): Messages<T> {
  return messages;
}

/** Intl's locale for dates and plain numbers in each language (prices keep formatMoney's "1.234,00 TL"). */
export const INTL_LOCALE: Record<Locale, string> = { tr: "tr-TR", en: "en-GB", ar: "ar-u-nu-latn" };
