import { api } from "@/lib/api";
import { CATALOG_PAGE_SIZE } from "@/lib/config";
import type { CatalogProduct, Category } from "@/types";

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
  const { data } = await api.get<CatalogProduct[]>("/products/", {
    params: { skip, limit, category: category || undefined, q: q || undefined },
    signal,
  });
  return data;
}

export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories/", { signal });
  return data;
}

/** Products with a live flash sale, priced for the caller (segment-aware when logged in). */
export async function fetchFlashSaleProducts(signal?: AbortSignal): Promise<CatalogProduct[]> {
  const { data } = await api.get<CatalogProduct[]>("/products/flash-sales", { signal });
  return data;
}

/** One product, priced for the caller (segment-aware when logged in). */
export async function fetchProduct(id: string, signal?: AbortSignal): Promise<CatalogProduct> {
  const { data } = await api.get<CatalogProduct>(`/products/${id}`, { signal });
  return data;
}
