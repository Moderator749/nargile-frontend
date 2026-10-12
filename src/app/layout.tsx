import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { StoreHydration } from "@/components/StoreHydration";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopBanner } from "@/components/layout/TopBanner";
import { ExportNotice } from "@/components/auth/ExportNotice";
import { AUTH_HINT_SCRIPT } from "@/lib/auth";
import { SIDEBAR_SCRIPT } from "@/lib/sidebar";
import { getBrands, getCategories } from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { resolveNav } from "@/lib/storefrontNav";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme";

// latin-ext carries Turkish ğ, ş, ı, İ — without it they fall back to another font.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Endüstriyel Toptan & Perakende Nargile Çözümleri`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};


export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cached for CATALOG_REVALIDATE like the catalog, so pages stay static/ISR.
  const [categories, brands, home] = await Promise.all([getCategories(), getBrands(), getHomepage()]);
  // The two menus from "Ana Sayfa Düzenleme", pointed at the catalog as it
  // stands (see lib/storefrontNav).
  const menu = resolveNav(home.navigation.top, categories ?? [], brands ?? []);
  const sidebar = resolveNav(home.navigation.sidebar, categories ?? [], brands ?? []);

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The pre-paint scripts below set the theme class and data-auth before hydration.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground selection:bg-accent selection:text-white">
        {/* Pre-paint: theme class, signed-in hint and sidebar state, set from
            storage before anything renders. `beforeInteractive` puts them in the
            initial HTML's <head>; a bare <script> element here would be rendered
            again by React on the client (e.g. for a 404) and warn. */}
        <Script id="theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Script id="auth-hint" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: AUTH_HINT_SCRIPT }} />
        <Script id="sidebar-state" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SIDEBAR_SCRIPT }} />
        <StoreHydration />
        {/* Shown to an export account on its first page after signing in, and
            not dismissable any other way. Renders nothing for everyone else. */}
        <ExportNotice />
        {/* Module 1: the welcome / special-day strip, above everything. */}
        <TopBanner />
        <Navbar categories={sidebar} links={menu} />
        {children}
        {home.sections.footer && <SiteFooter footer={home.footer} />}
      </body>
    </html>
  );
}
