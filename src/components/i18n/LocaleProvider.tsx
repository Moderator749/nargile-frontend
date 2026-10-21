"use client";

import { createContext, useContext, type ReactNode } from "react";

import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/**
 * The page's language for client components (the root layout sets it from
 * the [locale] segment). Without a provider — never on a storefront page — it
 * is Turkish.
 */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** The page's words. */
export function useT() {
  return getDictionary(useLocale());
}
