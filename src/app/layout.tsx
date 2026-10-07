import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { StoreHydration } from "@/components/StoreHydration";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { AUTH_HINT_SCRIPT } from "@/lib/auth";
import { getBrands, getCategories } from "@/lib/server/catalog";
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cached for CATALOG_REVALIDATE like the catalog, so pages stay static/ISR.
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The pre-paint scripts below set the theme class and data-auth before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: AUTH_HINT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground selection:bg-accent selection:text-white">
        <JsonLd data={organizationJsonLd} />
        <StoreHydration />
        <Navbar categories={categories ?? []} brands={brands ?? []} />
        {children}
        <SiteFooter categories={categories ?? []} />
      </body>
    </html>
  );
}
