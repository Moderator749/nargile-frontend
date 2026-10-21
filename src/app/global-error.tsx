"use client";

import "./globals.css";

import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { ErrorContent } from "@/components/layout/ErrorContent";
import { geistMono, geistSans } from "@/lib/fonts";
import { SITE_NAME } from "@/lib/site";

/**
 * The last resort: an error in the root layout itself, which this replaces
 * with its own document — so it brings the global styles and fonts, and the
 * shop's logo in place of the header it cannot render. ErrorContent's
 * PrePaintFallback applies the visitor's theme. Error boundaries cannot
 * export metadata; the title is React's <title>.
 */
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground selection:bg-accent selection:text-white">
        <title>{`Geçici bir sorun | ${SITE_NAME}`}</title>
        <header className="flex justify-center px-4 pt-10">
          <Link href="/" aria-label={`${SITE_NAME} ana sayfa`} className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600">
            <Logo />
          </Link>
        </header>
        <ErrorContent {...props} />
      </body>
    </html>
  );
}
