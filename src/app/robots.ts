import type { MetadataRoute } from "next";

import { INDEXING_ALLOWED, SITE_URL } from "@/lib/site";

/**
 * Crawl the storefront; stay out of the panel, the account, the cart and
 * checkout, and the API.
 *
 * Every one of these pages also says `noindex` itself. A disallowed URL that
 * someone links to can still be listed (bare, without its content), and only a
 * crawler that fetches the page sees that tag — so the meta tag is the
 * safeguard, and this list spares the crawl budget. The Turkish paths are the
 * names these pages are known by and may be given; listing them now costs
 * nothing.
 */
const PRIVATE_PATHS = [
  "/admin",
  "/kontrol-merkezi",
  "/account",
  "/hesabim",
  "/orders",
  "/cart",
  "/sepet",
  "/odeme",
  "/login",
  "/register",
  "/sifremi-unuttum",
  "/sifre-yenile",
  "/fiyat-katalogu",
  "/api",
];

export default function robots(): MetadataRoute.Robots {
  // Staging and previews: nothing to crawl at all.
  if (!INDEXING_ALLOWED) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // In every language: /en/cart is as private as /cart.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_PATHS, ...["/en", "/ar"].flatMap((prefix) => PRIVATE_PATHS.filter((p) => p !== "/admin" && p !== "/api").map((p) => `${prefix}${p}`))],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
