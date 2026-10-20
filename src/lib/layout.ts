/**
 * The storefront's one horizontal frame: centred, capped at 80rem, with the
 * same gutters at every breakpoint.
 *
 * The header row, the menu bar and the row the category column sits in all
 * take it from here, so the red "KATEGORİLER" cell and the column below it —
 * and the link row and the hero below that — share their edges by
 * construction rather than by three copies of the same classes agreeing.
 * Give a row its own padding or width and it will drift off the others.
 */
export const PAGE_CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6";

/**
 * The product grid of a catalog page (catalog, category, brand, "Fırsat
 * Ürünleri"): three to a row beside the open category column, four once it is
 * closed and the grid has the width (the column's state is on <html>, see
 * lib/sidebar).
 */
export const CATALOG_GRID = "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:sidebar-closed:grid-cols-4";
