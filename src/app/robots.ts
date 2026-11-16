import type { MetadataRoute } from "next";

import { INDEXING_ALLOWED, MEDIA_PATH, SITE_URL } from "@/lib/site";

/**
 * Crawl the storefront; stay out of the panel and the API.
 *
 * The account, cart, checkout, login and register pages are NOT listed here
 * on purpose: each says `noindex` itself, and Google only sees that tag on a
 * page it may fetch. A disallowed page that every header links to gets indexed
 * bare instead ("Indexed, though blocked by robots.txt" — /cart and /register
 * were, 2026-11). Allowed to crawl, they read noindex and stay out of the index.
 *
 * The API stays out — but for its uploads (MEDIA_PATH), where every product
 * photo is: the image sitemap and the product data name them, and Googlebot-
 * Image must be able to fetch them. The longer rule wins, whatever the order.
 * The panel (/admin, which /en/admin and /ar/admin redirect to) is noindex as
 * well and linked from nowhere public; it stays out to spare the crawl.
 * One group for every crawler (Googlebot, Googlebot-Image, Bingbot, YandexBot…):
 * none needs rules of its own.
 */
const PRIVATE_PATHS = ["/admin", "/api"];

export default function robots(): MetadataRoute.Robots {
  // Staging and previews: nothing to crawl at all.
  if (!INDEXING_ALLOWED) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: ["/", MEDIA_PATH], disallow: PRIVATE_PATHS },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
