import { api } from "@/lib/api";
import { CATALOG_PAGE_SIZE } from "@/lib/config";
import type { CartLineInfo, CatalogProduct, CatalogSummary, CatalogProductDetail, Category, SearchSuggestions, StockCheckLine } from "@/types";

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
 * A listing as a whole, where the grid has it a page at a time: how many
 * products it has, and its cheapest and dearest as the cards price them for
 * the caller.
 */
export async function fetchCatalogSummary(
  { category, q }: Pick<CatalogQuery, "category" | "q">,
  signal?: AbortSignal,
): Promise<CatalogSummary> {
  const { data } = await api.get<CatalogSummary>("/products/summary", {
    params: { category: category || undefined, q: q || undefined },
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

/**
 * A cart's colours as the cart page shows them before there is a quote: page,
 * code and whether the shop's stock has any, asked for live.
 */
export async function fetchCartLines(variantIds: string[], signal?: AbortSignal): Promise<CartLineInfo[]> {
  const params = new URLSearchParams();
  for (const id of variantIds.slice(0, 100)) params.append("ids", id);
  const { data } = await api.get<CartLineInfo[]>(`/products/cart-lines?${params}`, { signal });
  return data;
}

/**
 * Quantities held to the caller's stock: each as asked, or the most there is.
 * The count itself is never sent, only the quantity a line is taken down to.
 */
export async function checkStock(items: { variant_id: string; quantity: number }[]): Promise<StockCheckLine[]> {
  const { data } = await api.post<StockCheckLine[]>("/products/stock-check", { items: items.slice(0, 100) });
  return data;
}

/** The header search's suggestions for what has been typed so far (two letters or more). */
export async function fetchSuggestions(q: string, signal?: AbortSignal): Promise<SearchSuggestions> {
  const { data } = await api.get<SearchSuggestions>("/products/suggest", { params: { q }, signal });
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
