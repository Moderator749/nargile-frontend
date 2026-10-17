import { api } from "@/lib/api";
import { CATALOG_PAGE_SIZE } from "@/lib/config";
import type { CatalogProduct, CatalogProductDetail, Category } from "@/types";

export { CATALOG_PAGE_SIZE };

export interface CatalogQuery {
  skip?: number;
  limit?: number;
  /** Category slug; omit for all products. */
  category?: string | null;
  /** Free-text search over name, brand and product code. */
  q?: string;
}

export async function fetchProducts(
  { skip = 0, limit = CATALOG_PAGE_SIZE, category, q }: CatalogQuery = {},
  signal?: AbortSignal,
): Promise<CatalogProduct[]> {
  const { data } = await api.get<CatalogProduct[]>("/products", {
    params: { skip, limit, category: category || undefined, q: q || undefined },
    signal,
  });
  return data;
}

/**
 * These products, priced for the caller — a set the page already chose, in no
 * particular order (the caller keeps its own).
 */
export async function fetchProductsByIds(ids: string[], signal?: AbortSignal): Promise<CatalogProduct[]> {
  const params = new URLSearchParams({ limit: String(Math.min(ids.length, 100)) });
  for (const id of ids) params.append("ids", id);
  const { data } = await api.get<CatalogProduct[]>(`/products?${params}`, { signal });
  return data;
}

export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories", { signal });
  return data;
}

/** Products with a live flash sale, priced for the caller (segment-aware when logged in). */
export async function fetchFlashSaleProducts(signal?: AbortSignal): Promise<CatalogProduct[]> {
  // Matches the server-rendered list: every live deal, for the grid.
  const { data } = await api.get<CatalogProduct[]>("/products/flash-sales", { params: { limit: 50 }, signal });
  return data;
}

/** One product, priced for the caller (segment-aware when logged in). */
export async function fetchProduct(id: string, signal?: AbortSignal): Promise<CatalogProductDetail> {
  const { data } = await api.get<CatalogProductDetail>(`/products/${id}`, { signal });
  return data;
}
