import type { CatalogFilters, SortKey } from "@/lib/catalogFilters";

/**
 * The catalog's filters in its address (`?min=7000&max=8000&stok=1&sort=price-asc`),
 * so a reload, the back button and a shared link all open the grid as it was
 * left. Only what differs from the defaults is written; anything unreadable
 * in an address is read as no filter.
 */
const SORT_KEYS: readonly SortKey[] = ["recommended", "price-asc", "price-desc", "name-asc"];

/** The address's own names for the filters. */
export const FILTER_PARAMS = { min: "min", max: "max", inStock: "stok", sort: "sort" } as const;

const PRICE = /^[\d.,\s]{1,9}$/;

export function filtersFromParams(params: Pick<URLSearchParams, "get">): CatalogFilters {
  const price = (key: string) => {
    const raw = (params.get(key) ?? "").trim();
    return PRICE.test(raw) ? raw : "";
  };
  const sort = params.get(FILTER_PARAMS.sort) as SortKey | null;
  return {
    min: price(FILTER_PARAMS.min),
    max: price(FILTER_PARAMS.max),
    inStock: params.get(FILTER_PARAMS.inStock) === "1",
    sort: sort && SORT_KEYS.includes(sort) ? sort : "recommended",
  };
}

/** `params` (the rest of the address, the search term among it) with these filters written in. */
export function filtersToParams(filters: CatalogFilters, params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  const put = (key: string, value: string | null) => (value ? next.set(key, value) : next.delete(key));
  put(FILTER_PARAMS.min, filters.min.trim() || null);
  put(FILTER_PARAMS.max, filters.max.trim() || null);
  put(FILTER_PARAMS.inStock, filters.inStock ? "1" : null);
  put(FILTER_PARAMS.sort, filters.sort === "recommended" ? null : filters.sort);
  return next;
}
