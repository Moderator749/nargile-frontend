import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";

import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { StoreHydration } from "@/components/StoreHydration";
import { AUTH_HINT_SCRIPT } from "@/lib/auth";
import { geistMono, geistSans } from "@/lib/fonts";
import { DIRECTION, LOCALES, OG_LOCALE, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SIDEBAR_SCRIPT } from "@/lib/sidebar";
import { INDEXING_ALLOWED, SITE_NAME, SITE_URL } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme";

/**
 * Every language is built and cached like Turkish. (No `dynamicParams =
 * false` here: it would reach the pages below and turn every product not
 * built at deploy time into a 404. The proxy only ever routes to a language,
 * and the layout refuses anything else.)
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.siteTitle, template: `%s | ${SITE_NAME}` },
    description: t.meta.defaultDescription,
    applicationName: SITE_NAME,
    openGraph: { type: "website", locale: OG_LOCALE[locale], siteName: SITE_NAME },
    // A deployment that may not be indexed says so on every page.
    ...(INDEXING_ALLOWED ? {} : { robots: { index: false, follow: false } }),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};


/**
 * The document every page shares — the storefront's ((storefront)) and the
 * admin panel's ((admin)) — and nothing else: the language and its direction,
 * fonts, theme and the pre-paint scripts, the stores' hydration. Each group's
 * own layout adds its chrome, so neither side's code rides along with the
 * other's pages.
 *
 * It is the [locale] segment's: Turkish at the root (src/proxy.ts maps it),
 * English and Arabic under /en and /ar. Arabic is laid out right to left
 * (dir="rtl"); the admin panel is always Turkish.
 */
export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html
      lang={locale}
      dir={DIRECTION[locale]}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The pre-paint scripts below set the theme class and data-auth before hydration.
      suppressHydrationWarning
    >
      {/* Pre-paint: theme class, signed-in hint and sidebar state, set from
          storage before anything is painted. Plain inline scripts in <head>,
          which the browser runs as it parses them. Not `next/script`
          `beforeInteractive`: Next 16 sends those as a queue entry after
          <body> and runs them once its runtime has loaded — after the first
          paint, so a visitor saw the light theme, then the dark, and the
          category column slide shut (CLS over 1 on the homepage). The root
          layout is a server component, so React renders these once into the
          HTML and never re-runs them on the client; PrePaintFallback covers
          the 404 rendered without this layout's HTML. */}
      <head>
        <script id="theme" dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script id="auth-hint" dangerouslySetInnerHTML={{ __html: AUTH_HINT_SCRIPT }} />
        <script id="sidebar-state" dangerouslySetInnerHTML={{ __html: SIDEBAR_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground selection:bg-accent selection:text-white">
        <StoreHydration />
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
