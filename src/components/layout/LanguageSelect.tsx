"use client";

import { ChevronDown } from "lucide-react";

import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { usePagePath } from "@/components/i18n/navigation";
import { LANGUAGE_NAME, LOCALES, localePath, type Locale } from "@/lib/i18n/config";

const SHORT: Record<Locale, string> = { tr: "TR", en: "EN", ar: "AR" };

/**
 * The storefront's language, beside the currency: the same page in another
 * language (/catalog/luleler → /en/catalog/luleler), its query string kept.
 * A plain <select>, styled like CurrencySelect, so it works with a keyboard
 * and a screen reader as any form control does.
 */
export function LanguageSelect({ id = "site-language", className = "" }: { id?: string; className?: string }) {
  const locale = useLocale();
  const t = useT();
  const path = usePagePath();

  return (
    <div className={`relative shrink-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {t.nav.language}
      </label>
      <select
        id={id}
        value={locale}
        onChange={(e) => {
          const next = e.target.value as Locale;
          // A full load, not a client navigation: the document's language
          // and direction change, and the pre-paint scripts run for them. The
          // query string is read at the moment of the change (no
          // useSearchParams, which would hold a static page's header back).
          window.location.assign(`${localePath(next, path)}${window.location.search}`);
        }}
        className="h-9 cursor-pointer appearance-none rounded-full bg-transparent pe-7 ps-3 font-mono text-xs text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {SHORT[l]} · {LANGUAGE_NAME[l]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
