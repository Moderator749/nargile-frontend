// Server-only catalog reads for SEO rendering. Uses fetch (not axios) so results
// participate in Next.js caching. Always anonymous: public RETAIL prices only.

import { API_URL, CATALOG_PAGE_SIZE } from "@/lib/config";
import type { Brand, CatalogProduct, CatalogProductDetail, Category, HomeContent } from "@/types";

/** Seconds a cached catalog response is served before revalidating. */
export const CATALOG_REVALIDATE = 300;

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

export function getCategories(): Promise<Category[] | null> {
  return getJson<Category[]>("/categories/");
}

/**
 * The visible category a slug names now — its own, or one the admin has since
 * replaced (then the answer carries the new slug). Null when there is none.
 */
export function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (slug.length > 180 || !/^[a-z0-9-]+$/i.test(slug)) return Promise.resolve(null);
  return getJson<Category>(`/categories/by-slug/${encodeURIComponent(slug)}`);
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
  return getJson<CatalogProduct[]>(`/products/?${params}`);
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
  return getJson<Brand[]>("/brands/");
}

/** Homepage CMS content (slides, promo boxes, advantages); refreshed by admin saves. */
export function getHomeContent(): Promise<HomeContent | null> {
  return getJson<HomeContent>("/home/content");
}

/**
 * One product's photo from a corner of the catalog, for a showcase tile's
 * artwork. Null when that corner is empty — a category the shop has not stocked
 * yet — and the tile then falls back to its icon.
 *
 * Cached like every other catalog read (five minutes, `catalog` tag), so the
 * twelve tiles cost twelve requests per window rather than per visitor.
 */
export async function getTileArtwork(tile: { slug?: string | null; search?: string | null }): Promise<string | null> {
  // Nothing to look in: no photo, rather than the catalog's first product.
  if (!tile.slug && !tile.search) return null;
  const params = new URLSearchParams({ limit: "1" });
  if (tile.slug) params.set("category", tile.slug);
  else if (tile.search) params.set("q", tile.search);
  const rows = await getJson<CatalogProduct[]>(`/products/?${params}`);
  return rows?.[0]?.image_url ?? null;
}

/** A product's address segment: its slug (the old store's dotted spellings included) or its id. */
const PRODUCT_REF = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z0-9]+(?:[.-][a-z0-9]+)*)$/i;

/** One product (anonymous RETAIL view) for its detail page, by slug or id; null if missing or the API is down. */
export function getProduct(ref: string): Promise<CatalogProductDetail | null> {
  // Nothing that could not be a slug or an id goes to the API.
  if (ref.length > 255 || !PRODUCT_REF.test(ref)) return Promise.resolve(null);
  return getJson<CatalogProductDetail>(`/products/${encodeURIComponent(ref)}`);
}
