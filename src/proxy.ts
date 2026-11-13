import { NextResponse, type NextRequest } from "next/server";

import { LEGACY_CATEGORIES, LEGACY_PAGES, LEGACY_PARENT, RETIRED_CATEGORIES } from "./lib/legacy/categories";
import { ROOT_ROUTES, isRootSlugPath } from "./lib/rootRoutes";
import { OPENCART_CATEGORY_IDS, OPENCART_INFORMATION_IDS, OPENCART_PRODUCT_IDS, RETIRED_PRODUCTS } from "./lib/legacy/opencart";
import { UNAVAILABLE, atRoot, oldProductTarget, type Lookup } from "./lib/legacy/oldProduct";

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
 * a lookup here at all (down, slow, a 5xx), nothing is decided here: the
 * address is sent on, for now (307), to the product page at /<slug>, whose
 * own lookup is cached (ISR) and so answers through an outage; the 301 comes
 * on the next visit, once the API answers again. Whether it was an old
 * product link cannot be told, and a 404 would tell search engines the page
 * is gone — but the proxy itself never answers with an error: every lookup
 * is bounded (LOOKUP_TIMEOUT_MS) and every failure caught. Kept free of the
 * app's own modules: proxy code is built and run apart from the pages.
 */

/** The API itself, as src/lib/config.ts calls it on the server. */
const API_URL = `${(process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "")}/api/v1`;
/**
 * How long one lookup may take. A redirect is worth little after a wait, and
 * an API that hangs must not hold every legacy address with it: past this,
 * the lookup counts as unanswered (UNAVAILABLE) and the request moves on.
 */
const LOOKUP_TIMEOUT_MS = 3000;

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

/**
 * One field of an API answer: null on a 404 or when the field is missing,
 * UNAVAILABLE when the API could not say. Never throws: a failed lookup is
 * an answer of its own, not an error page.
 */
async function apiField(path: string, field: string): Promise<Lookup> {
  try {
    const res = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
    if (res.status === 404) return null;
    if (!res.ok) return UNAVAILABLE;
    const value = ((await res.json()) as Record<string, unknown>)[field];
    return typeof value === "string" && value ? value : null;
  } catch {
    return UNAVAILABLE;
  }
}

/** The slug of the published product this id or old address names. */
function productSlug(ref: string): Promise<Lookup> {
  return apiField(`/products/${encodeURIComponent(ref)}`, "slug");
}

/** The category of a product taken off sale (GET /products/{ref}/shelf). */
function productShelf(ref: string): Promise<Lookup> {
  return apiField(`/products/${encodeURIComponent(ref)}/shelf`, "category_slug");
}

/**
 * The same redirect, for now rather than for good: the API could not say
 * where an old address goes, so the visitor is sent on with a 307 — never
 * cached, by a browser or the CDN — to the product page by the address's own
 * slug or id, whose lookup is cached and answers through an outage (and
 * decides the 404 or the redirect itself). Search engines keep the old
 * address and find the 301 on their next visit.
 */
function forNow(redirect: NextResponse) {
  const location = redirect.headers.get("Location") ?? "/";
  return NextResponse.redirect(location, { status: 307, headers: { "Cache-Control": "no-store" } });
}

function moved(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone(); // the query string (utm_*…) comes along,
  url.pathname = pathname;
  // but not the old store's listing parameters, nor its product pages' ?tag=:
  // one 301 to the clean address, not a second to drop them.
  dropOpenCartListing(url);
  url.searchParams.delete("tag");
  return NextResponse.redirect(url, 301);
}

/**
 * An old category or page address, to where it lives now (lib/legacy/
 * categories): a category slug this shop retired, at the root or under
 * /catalog, in any language; and, the old store being Turkish, its shelves
 * (/nargile-siseleri, /diger/kozlukler) and pages at the root. An old address
 * that is a live slug today (/siseler, /oduman) is that page, not a redirect.
 */
function oldShelfOrPage(path: string, prefix: string): string | null {
  const segments = path.split("/").filter(Boolean);
  const [first, second] = segments.map((segment) => segment.toLowerCase());
  if (segments.length === 2 && first === "catalog" && RETIRED_CATEGORIES[second]) return `${prefix}/${RETIRED_CATEGORIES[second]}`;
  if (segments.length === 1 && RETIRED_CATEGORIES[first]) return `${prefix}/${RETIRED_CATEGORIES[first]}`;
  if (prefix) return null;
  if (segments.length === 1 && LEGACY_CATEGORIES[first] && LEGACY_CATEGORIES[first] !== first) return `/${LEGACY_CATEGORIES[first]}`;
  if (segments.length === 2 && first === LEGACY_PARENT && LEGACY_CATEGORIES[second]) return `/${LEGACY_CATEGORIES[second]}`;
  if (segments.length === 1 && LEGACY_PAGES[segments[0]]) return LEGACY_PAGES[segments[0]];
  return null;
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
  if (current === UNAVAILABLE) return forNow(go(request, `/${slug}`));
  if (current) return go(request, `/${current}`);
  const next = RETIRED_PRODUCTS[slug];
  return next ? go(request, atRoot(next)) : null;
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

/** A segment that could be an old product's slug: worth one lookup. */
function isProductSlug(slug: string): boolean {
  return slug.length <= 255 && SLUG.test(slug) && !FILE.test(slug) && !NOT_A_PRODUCT.test(slug);
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
    if (!UUID.test(ref)) {
      // An old store's slug: straight to where the product page would send
      // it (its current slug, its successor, its category), one 301 rather
      // than one to /<slug> and a second from there.
      const slug = ref.toLowerCase();
      if (!isProductSlug(slug)) return moved(request, `${prefix}/${slug}`);
      const target = await oldProductTarget(slug, {
        current: productSlug,
        retired: (key) => RETIRED_PRODUCTS[key],
        shelf: productShelf,
      });
      if (target === UNAVAILABLE) return forNow(moved(request, `${prefix}/${slug}`));
      return moved(request, `${prefix}${target ?? `/${slug}`}`);
    }
    const slug = await productSlug(ref);
    if (slug === UNAVAILABLE) return forNow(moved(request, `${prefix}/${ref}`));
    if (slug) return moved(request, `${prefix}/${slug}`);
  } else if (segments.length === 1 && segments[0] !== segments[0].toLowerCase() && !FILE.test(segments[0])) {
    // Slugs are lowercase: a link typed in capitals has one address too.
    return moved(request, `${prefix}/${segments[0].toLowerCase()}`);
  } else if (!prefix && segments.length === 2) {
    // /<category>/<slug>; the shop's own sections (/catalog/…, /bilgi/…) and
    // Next's files (/_next/…) are never the old store's, nor is what a
    // scanner asks for (/wp-admin/admin-ajax.php): no lookup for those.
    const [category, slug] = segments.map((segment) => segment.toLowerCase());
    if (!ROUTES.has(category) && SLUG.test(category) && isProductSlug(slug)) {
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
    if (shelf && isProductSlug(slug)) {
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

  const old = oldShelfOrPage(path, language ? `/${language}` : "");
  if (old) return moved(request, old);

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
  if (shelf) return moved(request, `${language ? `/${language}` : ""}/${shelf.toLowerCase()}`);

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
