"use client";

import "./globals.css";

import { usePathname } from "next/navigation";

import Link from "@/components/i18n/Link";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { Logo } from "@/components/brand/Logo";
import { ErrorContent } from "@/components/layout/ErrorContent";
import { geistMono, geistSans } from "@/lib/fonts";
import { DIRECTION, splitLocale } from "@/lib/i18n/config";
import { errorMessages, footerMessages } from "@/lib/i18n/messages/layout";
import { SITE_NAME } from "@/lib/site";

/**
 * The last resort: an error in the root layout itself, which this replaces
 * with its own document — so it brings the global styles and fonts, and the
 * shop's logo in place of the header it cannot render. ErrorContent's
 * PrePaintFallback applies the visitor's theme. Error boundaries cannot
 * export metadata; the title is React's <title>.
 *
 * It renders outside the [locale] layout and its LocaleProvider, so it reads
 * the language from the address (/en/…, /ar/…; Turkish at the root) and
 * provides it itself — the links, the words and the document's direction.
 */
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  const locale = splitLocale(usePathname() ?? "/").locale;
  const m = errorMessages[locale];
  return (
    <html
      lang={locale}
      dir={DIRECTION[locale]}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground selection:bg-accent selection:text-white">
        <LocaleProvider locale={locale}>
          <title>{`${m.eyebrow} | ${SITE_NAME}`}</title>
          <header className="flex justify-center px-4 pt-10">
            <Link
              href="/"
              aria-label={footerMessages[locale].homeAria(SITE_NAME)}
              className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600"
            >
              <Logo />
            </Link>
          </header>
          <ErrorContent {...props} />
        </LocaleProvider>
      </body>
    </html>
  );
}
