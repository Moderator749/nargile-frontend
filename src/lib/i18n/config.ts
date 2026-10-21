/**
 * The storefront's languages and their addresses.
 *
 * Turkish is the default and keeps the root (/catalog/luleler), so every
 * address indexed before English and Arabic existed stays where it is;
 * English and Arabic live under their prefix (/en/catalog/luleler,
 * /ar/catalog/luleler). src/proxy.ts maps the root onto the `tr` segment of
 * app/[locale] behind the scenes and sends /tr/… back to the root.
 *
 * No path aliases here: `npm test` imports this file as it is.
 */

export const LOCALES = ["tr", "en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/** Arabic reads right to left; the document says so (dir="rtl"). */
export const DIRECTION: Record<Locale, "ltr" | "rtl"> = { tr: "ltr", en: "ltr", ar: "rtl" };

/** Open Graph's locale codes. */
export const OG_LOCALE: Record<Locale, string> = { tr: "tr_TR", en: "en_US", ar: "ar_AR" };

/** Each language in its own name, for the switcher. */
export const LANGUAGE_NAME: Record<Locale, string> = { tr: "Türkçe", en: "English", ar: "العربية" };

/** Paths that are never in a language: the admin panel and the API. */
const UNLOCALIZED = /^\/(?:admin|api)(?:\/|$|\?|#)/;

/**
 * A site path in a language: "/catalog/luleler" → "/en/catalog/luleler";
 * Turkish keeps it as it is. Anything that is not a site path (an external
 * link, "#anchor", "mailto:") and the admin and API paths are left alone, as
 * is a path that already carries a language.
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/") || path.startsWith("//") || UNLOCALIZED.test(path)) return path;
  if (splitLocale(path).locale !== DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * The language a pathname is in and the pathname without its prefix:
 * "/en/catalog" → ("en", "/catalog"). "/tr/…" is Turkish's internal address
 * (the proxy's rewrite target, never shown to a visitor): a page prerendered
 * at build time sees it as its pathname, while the browser sees "/cart" — so
 * it is stripped too, or the two would render different pages and hydration
 * would fail.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const match = /^\/(tr|en|ar)(?=\/|$|\?|#)(.*)$/.exec(pathname);
  if (!match) return { locale: DEFAULT_LOCALE, path: pathname };
  const rest = match[2];
  return { locale: match[1] as Locale, path: rest === "" ? "/" : rest.startsWith("/") ? rest : `/${rest}` };
}
