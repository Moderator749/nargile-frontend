import { NextResponse, type NextRequest } from "next/server";

import { OPENCART_CATEGORY_IDS, OPENCART_INFORMATION_IDS, OPENCART_PRODUCT_IDS, RETIRED_PRODUCTS } from "./lib/legacy/opencart";

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
 * - An old product the shop no longer sells here (unpublished, or never
 *   brought over) goes to the same model if there is one, else the shelf it
 *   belonged on (RETIRED_PRODUCTS, measured
 *   from the old store's sitemap) — but only after the API was asked: a
 *   product published again takes its address back by itself.
 * - /index.php?route=…: the old store's addresses before its friendly URLs —
 *   a product by its OpenCart id, a category by its path, a search, the
 *   information pages, the home page (openCartRoute below).
 *
 * Anything the API does not know as a product goes on untouched (and ends at
 * the 404 page if nothing else answers it). When the API cannot answer at all
 * (down, slow, a 5xx), such an address gets a 503 instead: whether it is an
 * old product link cannot be told, and a 404 would tell search engines the
 * page is gone. Kept free of the app's own modules: proxy code is built and
 * run apart from the pages.
 */

/** The API itself, as src/lib/config.ts calls it on the server. */
const API_URL = `${(process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "")}/api/v1`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
/** Files served at the root: never product slugs, never worth a lookup. */
const FILE = /\.(?:txt|xml|svg|ico|png|jpe?g|webp|gif|js|css|json|map|webmanifest)$/i;
/** The storefront's own top-level pages (src/app). */
const ROUTES = new Set([
  "en", "ar", "tr", "account", "admin", "api", "bilgi", "blog", "cart", "catalog", "firsat-urunleri", "fiyat-katalogu", "images",
  "kargo-takip", "login", "marka", "onizleme", "orders", "product", "register", "sifre-yenile", "sifremi-unuttum", "sss",
  "opengraph-image",
]);

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
.retry{background:#dc2626;color:#fff}.home{color:#171717;box-shadow:inset 0 0 0 1px #e5e5e5}
@media (prefers-color-scheme:dark){body{background:#000;color:#fafafa}p{color:#a3a3a3}.home{color:#fafafa;box-shadow:inset 0 0 0 1px #404040}}</style></head>
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
  if (current) return go(request, `/product/${current}`);
  const next = RETIRED_PRODUCTS[slug];
  return next ? go(request, next) : null;
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
    return movedTo(request, category ? `/catalog/${category}` : "/catalog");
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
 * /product/<uuid>, /product/<CAPITALS>, and — at the root only, the old store
 * being Turkish — /<slug> and /<category>/<slug>. `prefix` is the language the
 * address was in ("" for Turkish), kept on the way.
 */
async function productRedirect(request: NextRequest, path: string, prefix: string) {
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "product" && UUID.test(segments[1])) {
    const slug = await productSlug(segments[1]);
    if (slug === UNAVAILABLE) return unavailable();
    if (slug) return moved(request, `${prefix}/product/${slug}`);
  } else if (segments.length === 2 && segments[0] === "product" && segments[1] !== segments[1].toLowerCase()) {
    // Slugs are lowercase: a link typed in capitals has one address too.
    return moved(request, `${prefix}/product/${segments[1].toLowerCase()}`);
  } else if (!prefix && (segments.length === 1 || segments.length === 2)) {
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
      const found = await legacyProduct(request, slug);
      if (found) return found;
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
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/index.php" || (pathname === "/" && request.nextUrl.searchParams.has("route"))) return openCartRoute(request);

  if (pathname === "/tr" || pathname.startsWith("/tr/")) return moved(request, pathname.slice(3) || "/");

  const language = /^\/(en|ar)(?=\/|$)/.exec(pathname)?.[1];
  const path = language ? pathname.slice(3) || "/" : pathname;
  if (language && /^\/admin(?:\/|$)/.test(path)) return moved(request, path);

  const redirect = await productRedirect(request, path, language ? `/${language}` : "");
  if (redirect) return redirect;

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
