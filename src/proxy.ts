import { NextResponse, type NextRequest } from "next/server";

import { LEGACY_CATEGORIES, LEGACY_PARENT } from "./lib/legacy/categories";
import { ROOT_ROUTES, isRootSlugPath } from "./lib/rootRoutes";
import { OPENCART_CATEGORY_IDS, OPENCART_INFORMATION_IDS, OPENCART_PRODUCT_IDS, RETIRED_PRODUCTS } from "./lib/legacy/opencart";

/*
 * Permanent (301) redirects to a product's one address, /<slug> at the root —
 * as the old store (OpenCart) addressed its products, the slugs carried over
 * as it spelled them (scripts/apply_legacy_product_slugs.py in the backend).
 * The page itself (app/[locale]/(storefront)/[slug]) answers an old spelling,
 * an id or a product the shop no longer sells (RETIRED_PRODUCTS) with a
 * permanent redirect of its own; here are the addresses it never sees:
 *
 * - /product/<slug>: where product pages were until 2026-10-29, indexed for
 *   the days in between. /product/<uuid>, from before slugs, is looked up.
 * - /<SLUG> in capitals: slugs are lowercase.
 * - /<category>/<slug>: an old product reached through one of the old store's
 *   category pages (/legend-hookah-nargile-takimlari/legend-hookah-celik-…),
 *   or /diger/<category>/<slug> under its "Diğer" shelf. The category part
 *   names no product, so only the last segment is looked up; a third of the
 *   old product links indexed are in this form. When that finds nothing, the
 *   category the address names (lib/legacy/categories) is where it goes.
 * - /catalog/<slug>: where category pages were until 2026-10-29; categories
 *   share the root with products now (the page tells them apart).
 * - /index.php?route=…: the old store's addresses before its friendly URLs —
 *   a product by its OpenCart id, a category by its path, a search, the
 *   information pages, the home page (openCartRoute below).
 *
 * The shop's own pages (/catalog, /cart, /blog…) are folders of src/app and
 * win over a slug by Next's own routing; the backend never gives a product a
 * slug one of them (or a redirect in next.config.ts) has taken
 * (RESERVED_ROOT_PATHS in its app/core/slugs.py). When the API cannot answer
 * a lookup here at all (down, slow, a 5xx), the address gets a 503: whether
 * it is an old product link cannot be told, and a 404 would tell search
 * engines the page is gone. Kept free of the app's own modules: proxy code is
 * built and run apart from the pages.
 */

/** The API itself, as src/lib/config.ts calls it on the server. */
const API_URL = `${(process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "")}/api/v1`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
/** Files served at the root: never product slugs, never worth a lookup. */
const FILE = /\.(?:txt|xml|svg|ico|png|jpe?g|webp|gif|js|css|json|map|webmanifest)$/i;
/** The storefront's own top-level pages (src/app): never a product's address. */
const ROUTES = new Set(ROOT_ROUTES);
/**
 * What a scanner asks for at the root (/wp-login.php, /.env, /backup.zip):
 * never a product. It goes to the 404 by the catch-all rather than the product
 * page, whose cache would keep a page for every such address.
 */
const NOT_A_PRODUCT = /^\.|\.(?:php\d?|aspx?|asmx|axd|jsp|cgi|action|do|env|ini|cfg|conf|config|ya?ml|log|sql|db|bak|old|orig|swp|zip|t?gz|tar|rar|7z|html?|sh|py|pl|rb|exe|dll)$/i;

/**
 * The shop's own address (NEXT_PUBLIC_SITE_URL), when CANONICAL_HOST_REDIRECT
 * is "true": after the domain move, a page asked for on the deployment's
 * *.vercel.app address answers with a 301 to the same page there, so search
 * engines see one site, not two. Set on the Production environment only, and
 * only once the domain points here — previews and staging keep their address.
 */
const CANONICAL_HOST = (() => {
  if (process.env.CANONICAL_HOST_REDIRECT !== "true") return null;
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  } catch {
    return null;
  }
})();

/**
 * The old store's listing parameters (?sort=p.price&order=ASC&limit=25,
 * ?page=2), which its category links carried and the category redirects
 * (next.config.ts) pass along to the shelf. The catalog reads none of them —
 * its own `sort` takes only these keys (lib/catalogFilterParams) — so an
 * address with them is the same page under another name, and is sent to it.
 */
const CATALOG_SORTS = new Set(["recommended", "price-asc", "price-desc", "name-asc"]);
const OPENCART_LISTING = ["order", "limit", "page"];

/** Takes the old store's listing parameters off `url`; whether it had any. */
function dropOpenCartListing(url: URL): boolean {
  const sort = url.searchParams.get("sort");
  const stale = OPENCART_LISTING.filter((key) => url.searchParams.has(key));
  if (sort !== null && !CATALOG_SORTS.has(sort)) stale.push("sort");
  for (const key of stale) url.searchParams.delete(key);
  return stale.length > 0;
}

/** The catalog address without the old store's listing parameters; null when it has none. */
function withoutOpenCartListing(request: NextRequest) {
  const url = request.nextUrl.clone();
  return dropOpenCartListing(url) ? NextResponse.redirect(url, 301) : null;
}

/**
 * A dead product under one of the old store's category addresses
 * (/rus-nargile-takimlari-ve-modelleri/blade-…, /diger/ozel-sipsiler/na15-…)
 * goes to that category's shelf here: the address itself names where it
 * belonged, so the shelf is the page it was about. Its listing parameters
 * (and the product page's ?tag=…) stay behind; the rest (utm_*…) comes along.
 */
function toLegacyShelf(request: NextRequest, category: string) {
  const url = request.nextUrl.clone();
  url.pathname = `/${category}`;
  dropOpenCartListing(url);
  url.searchParams.delete("tag");
  return NextResponse.redirect(url, 301);
}

/** The API did not answer the lookup. */
const UNAVAILABLE = Symbol("unavailable");

/**
 * The slug of the published product this id or old address names; null when
 * the API says there is none, UNAVAILABLE when it could not say.
 */
async function productSlug(ref: string): Promise<string | null | typeof UNAVAILABLE> {
  try {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(ref)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return UNAVAILABLE;
    const { slug } = (await res.json()) as { slug?: string };
    return slug || null;
  } catch {
    return UNAVAILABLE;
  }
}

/** The page for an address the API could not look up: retry, or go home. */
const UNAVAILABLE_PAGE = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Geçici bir sorun | Nargile Malzemesi</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#fff;color:#171717;text-align:center;padding:16px;box-sizing:border-box}
p{color:#737373;max-width:28rem;margin:12px auto 0;line-height:1.5}a{display:inline-block;margin:24px 6px 0;padding:12px 24px;border-radius:999px;font-weight:600;text-decoration:none}
.retry{background:#dc2626;color:#fff}.home{color:#171717;box-shadow:inset 0 0 0 1px #e5e5e5}</style></head>
<body><main><strong style="color:#dc2626;font-size:12px;letter-spacing:.25em">NARGİLE MALZEMESİ</strong>
<h1 style="margin:8px 0 0;font-size:28px">Sayfa şu anda yüklenemedi</h1>
<p>Bağlantıda kısa süreli bir sorun yaşadık. Birkaç saniye sonra yeniden deneyebilir ya da alışverişe ana sayfadan devam edebilirsiniz.</p>
<a class="retry" href="">Tekrar Dene</a><a class="home" href="/">Ana sayfaya dön</a></main></body></html>`;

/** 503 with Retry-After: search engines come back later instead of dropping the address. */
function unavailable() {
  return new NextResponse(UNAVAILABLE_PAGE, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "120", "Cache-Control": "no-store" },
  });
}

function moved(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone(); // the query string (utm_*…) comes along
  url.pathname = pathname;
  return NextResponse.redirect(url, 301);
}

/** A 301 to an address of our own, the old query string dropped (it named the old page). */
function movedTo(request: NextRequest, pathname: string, query?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = query ? `?${new URLSearchParams(query)}` : "";
  return NextResponse.redirect(url, 301);
}

/**
 * An old product's address, by its OpenCart slug: its page here, else its
 * shelf, else nothing known. `go` is how to send it: keeping the query string
 * (utm_*…) for a friendly address, dropping it for /index.php?route=….
 */
async function legacyProduct(request: NextRequest, slug: string, go: (request: NextRequest, pathname: string) => NextResponse = moved) {
  const current = await productSlug(slug);
  if (current === UNAVAILABLE) return unavailable();
  if (current) return go(request, `/${current}`);
  const next = RETIRED_PRODUCTS[slug];
  return next ? go(request, next.replace(/^\/(?:product|catalog)\//, "/")) : null;
}

/**
 * The old store's unfriendly addresses, /index.php?route=… (and /?route=…),
 * each sent to its page here: products by OpenCart id, categories by the
 * last id of their path, searches to the catalog search, information pages
 * to Bilgi, the account and checkout to ours, anything else home. Never a
 * 404: these are what an old bookmark or a crawler's oldest memory holds.
 */
async function openCartRoute(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const route = params.get("route") ?? "common/home";
  if (route === "product/product") {
    const slug = OPENCART_PRODUCT_IDS[params.get("product_id") ?? ""];
    return (slug && (await legacyProduct(request, slug, (r, p) => movedTo(r, p)))) || movedTo(request, "/catalog");
  }
  if (route === "product/category") {
    const id = (params.get("path") ?? "").split("_").pop() ?? "";
    const category = OPENCART_CATEGORY_IDS[id];
    return movedTo(request, category ? `/${category}` : "/catalog");
  }
  if (route === "product/search") {
    const q = (params.get("search") ?? params.get("tag") ?? "").trim().slice(0, 100);
    return movedTo(request, "/catalog", q ? { q } : undefined);
  }
  if (route.startsWith("product/")) return movedTo(request, "/catalog"); // special, manufacturer, compare
  if (route === "information/information") return movedTo(request, OPENCART_INFORMATION_IDS[params.get("information_id") ?? ""] ?? "/bilgi");
  if (route.startsWith("information/")) return movedTo(request, route === "information/contact" ? "/" : "/bilgi");
  if (route.startsWith("checkout/")) return movedTo(request, "/cart");
  if (route.startsWith("account/")) return movedTo(request, "/account");
  if (route.startsWith("blog/") || route.startsWith("extension/blog")) return movedTo(request, "/blog");
  return movedTo(request, "/");
}

/**
 * Legacy addresses that point at a product, answered with a 301 to its page:
 * /product/<slug> and /product/<uuid> in any language, a slug in capitals,
 * and — at the root only, the old store being Turkish — /<category>/<slug>.
 * `prefix` is the language the address was in ("" for Turkish), kept on the way.
 */
async function productRedirect(request: NextRequest, path: string, prefix: string) {
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "product") {
    const ref = segments[1];
    if (!UUID.test(ref)) return moved(request, `${prefix}/${ref.toLowerCase()}`);
    const slug = await productSlug(ref);
    if (slug === UNAVAILABLE) return unavailable();
    if (slug) return moved(request, `${prefix}/${slug}`);
  } else if (segments.length === 1 && segments[0] !== segments[0].toLowerCase() && !FILE.test(segments[0])) {
    // Slugs are lowercase: a link typed in capitals has one address too.
    return moved(request, `${prefix}/${segments[0].toLowerCase()}`);
  } else if (!prefix && segments.length === 2) {
    // /<category>/<slug>; the shop's own sections (/catalog/…, /bilgi/…) and
    // Next's files (/_next/…) are never the old store's.
    const [category, slug] = segments.map((segment) => segment.toLowerCase());
    if (!ROUTES.has(category) && SLUG.test(category) && !FILE.test(slug) && SLUG.test(slug) && slug.length <= 255) {
      const found = await legacyProduct(request, slug);
      if (found) return found;
      // No such product: an old category's address still says where it was.
      const shelf = LEGACY_CATEGORIES[category];
      if (shelf) return toLegacyShelf(request, shelf);
    }
  } else if (!prefix && segments.length === 3 && segments[0].toLowerCase() === LEGACY_PARENT) {
    // /diger/<category>/<slug>: the old store's accessory shelves, one level
    // down. Only under a category it had — /diger/te/… was a test shelf.
    const shelf = LEGACY_CATEGORIES[segments[1].toLowerCase()];
    const slug = segments[2].toLowerCase();
    if (shelf && !FILE.test(slug) && SLUG.test(slug) && slug.length <= 255) {
      return (await legacyProduct(request, slug)) ?? toLegacyShelf(request, shelf);
    }
  }
  return null;
}

/**
 * Every page request, in three steps.
 *
 * 1. Languages (src/lib/i18n/config): Turkish keeps the root, so /tr/… is sent
 *    back to it (one address per page); /en/… and /ar/… are their own segment
 *    of app/[locale]; the admin panel is never in a language. Anything at the
 *    root is served from the `tr` segment, its address unchanged (a rewrite).
 * 2. Legacy product addresses, in whichever language they came (above).
 * 3. The rest goes on.
 *
 * Before all of it, a page on the deployment's own address goes to the shop's
 * (CANONICAL_HOST), once that is switched on.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const host = request.headers.get("host")?.split(":")[0] ?? request.nextUrl.hostname;
  if (CANONICAL_HOST && host !== CANONICAL_HOST.hostname && host.endsWith(".vercel.app")) {
    return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, CANONICAL_HOST.origin), 301);
  }

  if (pathname === "/index.php" || (pathname === "/" && request.nextUrl.searchParams.has("route"))) return openCartRoute(request);

  if (pathname === "/tr" || pathname.startsWith("/tr/")) return moved(request, pathname.slice(3) || "/");

  const language = /^\/(en|ar)(?=\/|$)/.exec(pathname)?.[1];
  const path = language ? pathname.slice(3) || "/" : pathname;
  if (language && /^\/admin(?:\/|$)/.test(path)) return moved(request, path);

  // `/catalog?category=<slug>`, how other shops (and old links) name a
  // category: its page, the parameter left behind. Not for good — the
  // address does not say the category exists.
  const asked = path === "/catalog" ? request.nextUrl.searchParams.get("category") : null;
  if (asked && /^[a-z0-9-]+$/.test(asked)) {
    const url = request.nextUrl.clone();
    url.pathname = `${language ? `/${language}` : ""}/${asked}`;
    url.searchParams.delete("category");
    return NextResponse.redirect(url, 307);
  }

  // /catalog/<slug>, where category pages were until 2026-10-29: one 301 to
  // /<slug>, the old store's listing parameters left behind on the way.
  const shelf = /^\/catalog\/([^/]+)\/?$/.exec(path)?.[1];
  if (shelf) {
    const url = request.nextUrl.clone();
    url.pathname = `${language ? `/${language}` : ""}/${shelf.toLowerCase()}`;
    dropOpenCartListing(url);
    return NextResponse.redirect(url, 301);
  }

  // The catalog, a category or a product with the old store's listing
  // parameters: the same page without them.
  if (request.nextUrl.search && (path === "/catalog" || isRootSlugPath(path))) {
    const clean = withoutOpenCartListing(request);
    if (clean) return clean;
  }

  const redirect = await productRedirect(request, path, language ? `/${language}` : "");
  if (redirect) return redirect;

  // A scanner's file at the root: the catch-all's 404, not the product page.
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 1 && !ROUTES.has(segments[0]) && NOT_A_PRODUCT.test(decodeURIComponent(segments[0]))) {
    const url = request.nextUrl.clone();
    url.pathname = `/${language ?? "tr"}/_/${segments[0]}`;
    return NextResponse.rewrite(url);
  }

  if (language) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/tr${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Every page: not Next's own files (/_next), not the API proxy (/api), not a
  // file by its extension (icons, robots.txt, the sitemap, public images).
  // Extensions only — some product slugs carry a dot (an old store's "1.5").
  matcher: [
    "/((?!_next/|api/|.*\\.(?:txt|xml|svg|ico|png|jpe?g|webp|avif|gif|js|css|json|map|webmanifest|woff2?|pdf)$).*)",
  ],
};
