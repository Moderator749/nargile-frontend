// The language of the page being rendered, for server code anywhere under
// app/[locale] — layouts, pages, generateMetadata and the data helpers they
// call — without passing it down: next/root-params reads the [locale] segment.

import { locale as rootLocale } from "next/root-params";

import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";

/**
 * The page's language; Turkish where there is no [locale] segment to read —
 * a route handler (the sitemap, robots.txt), which root params do not reach.
 */
export async function getLocale(): Promise<Locale> {
  try {
    const value = await rootLocale();
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** The page's language and its words. */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
