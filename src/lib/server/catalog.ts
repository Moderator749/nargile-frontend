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

export function getPublicProducts(
  category?: string,
  limit: number = CATALOG_PAGE_SIZE,
  skip = 0,
): Promise<CatalogProduct[] | null> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (category) params.set("category", category);
  return getJson<CatalogProduct[]>(`/products/?${params}`);
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
export async function getTileArtwork(tile: { slug?: string; search?: string }): Promise<string | null> {
  const params = new URLSearchParams({ limit: "1" });
  if (tile.slug) params.set("category", tile.slug);
  else if (tile.search) params.set("q", tile.search);
  const rows = await getJson<CatalogProduct[]>(`/products/?${params}`);
  return rows?.[0]?.image_url ?? null;
}

/** One product (anonymous RETAIL view) for its detail page; null if missing or the API is down. */
export function getProduct(id: string): Promise<CatalogProductDetail | null> {
  // Product ids are UUIDs: don't even ask the API for anything else.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Promise.resolve(null);
  return getJson<CatalogProductDetail>(`/products/${id}`);
}
