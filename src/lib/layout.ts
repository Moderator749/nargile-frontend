/**
 * The storefront's one horizontal frame: centred, capped at 80rem, with the
 * same gutters at every breakpoint.
 *
 * The header row, the menu bar and the row the category column sits in all
 * take it from here, so the red "KATAGORİLER" cell and the column below it —
 * and the pill tray and the hero below that — share their edges by
 * construction rather than by three copies of the same classes agreeing.
 * Give a row its own padding or width and it will drift off the others.
 */
export const PAGE_CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6";
