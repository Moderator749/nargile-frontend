import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
        {children}
      </body>
    </html>
  );
}
