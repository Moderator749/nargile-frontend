export const SITE_NAME = "Nargile Malzemesi";

/** Public origin, used for canonical URLs, Open Graph and JSON-LD. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const DEFAULT_DESCRIPTION =
  "Orijinal nargile takımı modelleri, lüle, nargile kömürü, közlük ve marpuç çeşitleri. Kafe, toptancı ve bayilere özel fiyatlar, 3.000 TL üzeri ücretsiz kargo.";

/**
 * Whether search engines may index this deployment. Off unless the
 * environment turns it on: a staging site (test.nargilemalzemesi.com) must
 * never be indexed, or it competes with the real shop for its own pages. Set
 * NEXT_PUBLIC_ALLOW_INDEXING=true on the production deployment only.
 */
export const INDEXING_ALLOWED = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

/** Where the API's uploads are served through this site (next.config's /api/backend proxy). */
export const MEDIA_PATH = "/api/backend/media/";

/**
 * A photo's address as search engines should know it: one of the API's uploads
 * served through any deployment of this site (the staging host, a preview, the
 * real domain: the same file behind each) is put on the shop's own domain, so
 * the sitemap's images and the product data name the canonical host, not
 * whichever one the API wrote into the URL. Anything else is left as it is.
 */
export function canonicalMedia(src: string): string {
  if (src.startsWith(MEDIA_PATH)) return `${SITE_URL}${src}`;
  try {
    const url = new URL(src);
    return url.pathname.startsWith(MEDIA_PATH) ? `${SITE_URL}${url.pathname}` : src;
  } catch {
    return src;
  }
}

/** Shared metadata for pages that must never appear in search results. */
export const PRIVATE_ROBOTS = { index: false, follow: false } as const;

/** The shared preview image (app/opengraph-image.tsx) for pages without a photo of their own. */
export const DEFAULT_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME } as const;

/** The storefront's search results page; `{search_term_string}` is the WebSite SearchAction slot. */
export const SEARCH_URL_TEMPLATE = `${SITE_URL}/catalog?q={search_term_string}`;
