import { api } from "@/lib/api";
import type { CatalogProduct } from "@/types";

export const CATALOG_PAGE_SIZE = 48;

export async function fetchProducts(
  { skip = 0, limit = CATALOG_PAGE_SIZE }: { skip?: number; limit?: number } = {},
  signal?: AbortSignal,
): Promise<CatalogProduct[]> {
  const { data } = await api.get<CatalogProduct[]>("/products/", {
    params: { skip, limit },
    signal,
  });
  return data;
}
