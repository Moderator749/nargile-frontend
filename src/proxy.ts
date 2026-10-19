import { NextResponse, type NextRequest } from "next/server";

/*
 * Permanent (301) redirects to a product's one address, /product/<slug>:
 *
 * - /product/<uuid>: how product pages were addressed before slugs. Links
 *   already shared, bookmarked or indexed keep working, and search engines move
 *   their ranking over to the slug address.
 * - /product/<SLUG> in capitals: the same address in lowercase.
 * - /<slug>: how the old store (OpenCart) addressed the same products. When the
 *   domain moves to this storefront, every old product link lands on its page
 *   here instead of a 404 — the slugs were carried over as the old store spelled
 *   them (scripts/apply_legacy_product_slugs.py in the backend).
 * - /<category>/<slug>: the same, reached through one of the old store's
 *   category pages (/legend-hookah-nargile-takimlari/legend-hookah-celik-…).
 *   The category part names no product, so only the last segment is looked up;
 *   a third of the old product links indexed are in this form.
 *
 * Anything the API does not know as a product goes on untouched (and ends at
 * the 404 page if nothing else answers it). Kept free of the app's own modules:
 * proxy code is built and run apart from the pages.
 */

/** The API itself, as src/lib/config.ts calls it on the server. */
const API_URL = `${(process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "")}/api/v1`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
/** Files served at the root: never product slugs, never worth a lookup. */
const FILE = /\.(?:txt|xml|svg|ico|png|jpe?g|webp|gif|js|css|json|map|webmanifest)$/i;
/** The storefront's own top-level pages (src/app). */
const ROUTES = new Set([
  "account", "admin", "api", "bilgi", "blog", "cart", "catalog", "firsat-urunleri", "fiyat-katalogu", "images",
  "login", "marka", "orders", "product", "register", "sifre-yenile", "sifremi-unuttum", "sss", "opengraph-image",
]);

/** The slug of the published product this id or old address names; null when there is none. */
async function productSlug(ref: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(ref)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const { slug } = (await res.json()) as { slug?: string };
    return slug || null;
  } catch {
    // API down or slow: let the page answer (it redirects too, with a 308).
    return null;
  }
}

function moved(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone(); // the query string (utm_*…) comes along
  url.pathname = pathname;
  return NextResponse.redirect(url, 301);
}

export async function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "product" && UUID.test(segments[1])) {
    const slug = await productSlug(segments[1]);
    if (slug) return moved(request, `/product/${slug}`);
  } else if (segments.length === 2 && segments[0] === "product" && segments[1] !== segments[1].toLowerCase()) {
    // Slugs are lowercase: a link typed in capitals has one address too.
    return moved(request, `/product/${segments[1].toLowerCase()}`);
  } else if (segments.length === 1 || segments.length === 2) {
    // /<slug> or /<category>/<slug>; the shop's own sections (/catalog/…,
    // /bilgi/…) and Next's files (/_next/…) are never the old store's.
    const legacy = segments.map((segment) => segment.toLowerCase());
    const slug = legacy[legacy.length - 1];
    const category = legacy.length === 2 ? legacy[0] : null;
    if (
      !ROUTES.has(legacy[0]) &&
      (category === null || SLUG.test(category)) &&
      !FILE.test(slug) && SLUG.test(slug) && slug.length <= 255
    ) {
      const current = await productSlug(slug);
      if (current) return moved(request, `/product/${current}`);
    }
  }
  return NextResponse.next();
}

export const config = {
  // A product id under /product, or one or two segments at the root (files and
  // the shop's own pages are waved through above). Deeper paths never enter.
  matcher: ["/product/:ref", "/:segment", "/:category/:slug"],
};
