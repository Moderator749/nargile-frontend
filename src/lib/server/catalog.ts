// Server-only catalog reads for SEO rendering. Uses fetch (not axios) so results
// participate in Next.js caching. Always anonymous: public RETAIL prices only.

import { API_URL, CATALOG_PAGE_SIZE } from "@/lib/config";
import { DEFAULT_STORE_PARAMETERS } from "@/lib/storeParameters";
import type {
  Brand,
  CatalogProduct,
  CatalogProductDetail,
  Category,
  HomeContent,
  StoreParameters,
  SultanPuanShowcase,
} from "@/types";

/**
 * Seconds a cached catalog response is served before revalidating: a day.
 *
 * Every admin edit drops the "catalog" tag (`refreshStorefront`), so edits show
 * on the next request whatever this says; the timer only catches what changes
 * without one (stock sold, bestsellers). It is also the floor for every page
 * that reads the catalog — a route regenerates on its shortest fetch window,
 * not its own `revalidate` — and each regeneration is an ISR write on Vercel,
 * where the free tier allows 200,000. At five minutes, crawlers walking the
 * product pages used them all up (October 2026).
 */
export const CATALOG_REVALIDATE = 86400;

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: CATALOG_REVALIDATE, tags: ["catalog"] },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    // Backend unreachable (e.g. during a build): the client fetches on mount instead.
    return null;
  }
}

/**
 * The API could not answer — unreachable, timed out, or a 5xx — which is not
 * the same as "there is no such thing". Thrown rather than read as a 404: on a
 * background regeneration the last good copy of the page stays in the cache
 * (a 404 would replace it for a day), and an uncached page answers with a 500
 * and app/(storefront)/error.tsx, which search engines treat as temporary.
 */
export class BackendUnavailableError extends Error {
  constructor(what: string, options?: ErrorOptions) {
    super(`Catalog API unavailable: ${what}`, options);
    this.name = "BackendUnavailableError";
  }
}

/**
 * A read a page decides a 404 on: the body, null only when the API says 404,
 * and BackendUnavailableError for anything else that is not an answer.
 */
async function getJsonOrNotFound<T>(path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: CATALOG_REVALIDATE, tags: ["catalog"] },
    });
  } catch (cause) {
    throw new BackendUnavailableError(path, { cause });
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new BackendUnavailableError(`${path} answered ${res.status}`);
  return (await res.json()) as T;
}

/**
 * A list a page decides a 404 on (the category or brand it names is not in
 * it). Lists never 404, so null from `getJson` means the API did not answer.
 */
export function required<T>(list: T | null, what: string): T {
  if (list === null) throw new BackendUnavailableError(what);
  return list;
}

export function getCategories(): Promise<Category[] | null> {
  return getJson<Category[]>("/categories");
}

/**
 * The visible category a slug names now — its own, or one the admin has since
 * replaced (then the answer carries the new slug). Null when there is none;
 * throws BackendUnavailableError when the API cannot say.
 */
export function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (slug.length > 180 || !/^[a-z0-9-]+$/i.test(slug)) return Promise.resolve(null);
  return getJsonOrNotFound<Category>(`/categories/by-slug/${encodeURIComponent(slug)}`);
}

export function getPublicProducts(
  category?: string,
  limit: number = CATALOG_PAGE_SIZE,
  skip = 0,
  q?: string,
): Promise<CatalogProduct[] | null> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  return getJson<CatalogProduct[]>(`/products?${params}`);
}

/**
 * "Yeni Gelenler": the latest products added, newest first. A product saved in
 * the admin drops the catalog cache (`refreshStorefront`), so it shows at once.
 */
export function getNewestProducts(limit: number): Promise<CatalogProduct[] | null> {
  return getJson<CatalogProduct[]>(`/products?sort=newest&limit=${limit}`);
}

/**
 * "Çok Satanlar": the products sold most (approved and shipped orders), the
 * most first — only those that have sold, so it may be short. An approval does
 * not drop the cache: a sale moves the list within the cache window.
 */
export function getBestsellers(limit: number): Promise<CatalogProduct[] | null> {
  return getJson<CatalogProduct[]>(`/products/bestsellers?limit=${limit}`);
}

/**
 * The Sultan Puan row: the earning rule and the products priced inside its
 * band. Saving "Parametreler" drops the catalog cache, so a new band shows at once.
 */
export function getSultanPuanShowcase(): Promise<SultanPuanShowcase | null> {
  return getJson<SultanPuanShowcase>("/products/sultanpuan");
}

/**
 * A category's whole public list (subcategories included), page by page —
 * the product page picks its "Benzer Ürünler" from it. Cached like any
 * catalog read, so every product of a category shares the same requests.
 */
export async function getCategoryProducts(slug: string, max = 300): Promise<CatalogProduct[]> {
  const products: CatalogProduct[] = [];
  for (let skip = 0; skip < max; skip += 100) {
    const page = await getPublicProducts(slug, 100, skip);
    if (!page) break;
    products.push(...page);
    if (page.length < 100) break;
  }
  return products;
}

/** The server's ceiling for one page of deals. */
export const FLASH_SALE_LIMIT = 50;

/** Live flash sales, read per request (never cached): a sale must show the moment it starts. */
export async function getFlashSaleProducts(): Promise<CatalogProduct[] | null> {
  try {
    // The section is a grid now: ask for every live deal, not a rail's worth.
    const res = await fetch(`${API_URL}/products/flash-sales?limit=${FLASH_SALE_LIMIT}`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as CatalogProduct[]) : null;
  } catch {
    return null;
  }
}

/** Active brands (menu + marquee); cached with the catalog, refreshed by admin saves. */
export function getBrands(): Promise<Brand[] | null> {
  return getJson<Brand[]>("/brands");
}

/** Homepage CMS content (slides, the promo box); refreshed by admin saves. */
export function getHomeContent(): Promise<HomeContent | null> {
  return getJson<HomeContent>("/home/content");
}

/**
 * One product's photo from a corner of the catalog, for a showcase tile's
 * artwork. Null when that corner is empty — a category the shop has not stocked
 * yet — and the tile then falls back to its icon.
 *
 * Cached like every other catalog read (a day, `catalog` tag), so the
 * twelve tiles cost twelve requests per window rather than per visitor.
 */
export async function getTileArtwork(tile: { slug?: string | null; search?: string | null }): Promise<string | null> {
  // Nothing to look in: no photo, rather than the catalog's first product.
  if (!tile.slug && !tile.search) return null;
  const params = new URLSearchParams({ limit: "1" });
  if (tile.slug) params.set("category", tile.slug);
  else if (tile.search) params.set("q", tile.search);
  const rows = await getJson<CatalogProduct[]>(`/products?${params}`);
  return rows?.[0]?.image_url ?? null;
}

/** A product's address segment: its slug (the old store's dotted spellings included) or its id. */
const PRODUCT_REF = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z0-9]+(?:[.-][a-z0-9]+)*)$/i;

/**
 * One product (anonymous RETAIL view) for its detail page, by slug or id; null
 * when the API says there is none, BackendUnavailableError when it cannot say.
 */
export function getProduct(ref: string): Promise<CatalogProductDetail | null> {
  // Nothing that could not be a slug or an id goes to the API.
  if (ref.length > 255 || !PRODUCT_REF.test(ref)) return Promise.resolve(null);
  return getJsonOrNotFound<CatalogProductDetail>(`/products/${encodeURIComponent(ref)}`);
}

/**
 * "Parametreler" — free shipping, the coal rule, the discount ladders, Sultan
 * Puan — as checkout applies them, for pages that state the rules. Read fresh
 * every time (no-store), not from the catalog's day-long cache: a page quoting
 * the rules must never quote yesterday's, whether or not the change was made
 * through the panel. If the API cannot be reached, the server's own defaults.
 */
export async function getStoreParameters(): Promise<StoreParameters> {
  try {
    const res = await fetch(`${API_URL}/settings/parameters`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as StoreParameters) : DEFAULT_STORE_PARAMETERS;
  } catch {
    return DEFAULT_STORE_PARAMETERS;
  }
}
