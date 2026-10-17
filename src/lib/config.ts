// Dependency-free constants, safe to import from server and client code.

/**
 * The API's own address (origin, no path), for the server only: where
 * next.config.ts forwards /api/backend to, and where rendering, route handlers
 * and src/proxy.ts call it. Not NEXT_PUBLIC_: it never reaches a browser.
 */
export const BACKEND_URL = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

/** This site's own path to the API, forwarded to BACKEND_URL by next.config.ts. */
export const API_PROXY_PATH = "/api/backend/api/v1";

/**
 * The API's base URL.
 *
 * In the browser, always the site's proxy path: the page's own origin, so HTTPS
 * whenever the page is (never mixed content), with no CORS, and the API's own
 * address stays on the server. On the server, the API itself: a request between
 * servers that no browser sees, one hop shorter than going out through the
 * site's public address and back in.
 */
export const API_URL = typeof window === "undefined" ? `${BACKEND_URL}/api/v1` : API_PROXY_PATH;

export const CATALOG_PAGE_SIZE = 48;

/** Homepage featured carousel: 3 views of 4 on desktop. */
export const FEATURED_PRODUCTS_COUNT = 12;
