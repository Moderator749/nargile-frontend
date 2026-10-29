/**
 * The storefront's own pages at the root (folders of src/app/[locale] and
 * its (storefront) group, the languages, the API): what a product's or a
 * category's address, /<slug>, can never be. Next's routing already serves these before the
 * product page; src/proxy.ts and lib/sidebar read the list to tell a product's
 * address from a page's, and the backend gives no product a slug among them
 * (RESERVED_ROOT_PATHS in app/core/slugs.py, which also holds the old
 * store's addresses next.config.ts redirects). rootRoutes.test.mjs checks the
 * list against the folders. No path aliases: the proxy is built apart.
 */
export const ROOT_ROUTES: readonly string[] = [
  "en", "ar", "tr", "api", "_next", "_",
  "account", "admin", "bilgi", "blog", "cart", "catalog", "checkout", "firsat-urunleri", "fiyat-katalogu", "images",
  "kargo-takip", "login", "magazalar", "marka", "onizleme", "orders", "product", "register", "sifre-yenile",
  "sifremi-unuttum", "sozlesmeler", "sss", "opengraph-image",
];

const ROUTES = new Set(ROOT_ROUTES);

/**
 * Whether a path (with or without /en, /ar) is a product's or a category's
 * page: one segment, not one of the shop's own pages. Which of the two it is
 * only the category list can tell (lib/sidebar, app/[locale]/(storefront)/[slug]).
 */
export function isRootSlugPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const path = segments[0] === "en" || segments[0] === "ar" ? segments.slice(1) : segments;
  return path.length === 1 && !ROUTES.has(path[0]);
}
