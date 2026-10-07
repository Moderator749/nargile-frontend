// Dependency-free constants, safe to import from server and client code.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export const CATALOG_PAGE_SIZE = 48;

/** Homepage featured carousel: 3 views of 4 on desktop. */
export const FEATURED_PRODUCTS_COUNT = 12;
