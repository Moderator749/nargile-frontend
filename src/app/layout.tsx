import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { StoreHydration } from "@/components/StoreHydration";
import { AUTH_HINT_SCRIPT } from "@/lib/auth";
import { SIDEBAR_SCRIPT } from "@/lib/sidebar";
import { DEFAULT_DESCRIPTION, INDEXING_ALLOWED, SITE_NAME, SITE_URL } from "@/lib/site";
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
  // A deployment that may not be indexed says so on every page.
  ...(INDEXING_ALLOWED ? {} : { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};


/**
 * The document every page shares — the storefront's (app/(storefront)) and the
 * admin panel's (app/(admin)) — and nothing else: fonts, theme and the
 * pre-paint scripts, the stores' hydration. Each group's own layout adds its
 * chrome, so neither side's code rides along with the other's pages.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
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
        {children}
      </body>
    </html>
  );
}
