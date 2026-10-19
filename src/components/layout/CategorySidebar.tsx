import { Suspense } from "react";

import { CategoryList } from "@/components/layout/CategoryList";
import type { ResolvedNav } from "@/lib/storefrontNav";

/**
 * The category column's width — shared with the "KATEGORİLER" cell above it and
 * with the header's logo block, so the column line runs straight down through
 * all three and the search bar starts exactly where the top bar's first entry does.
 *
 * Written out rather than composed (`lg:${SIDEBAR_WIDTH}`) because Tailwind
 * finds its classes by reading the source: a class assembled at runtime is a
 * class that was never generated.
 */
export const SIDEBAR_WIDTH = "w-64";
export const SIDEBAR_WIDTH_LG = "lg:w-64";

/**
 * Kategoriler: the column down the left of the storefront, closed until the
 * visitor opens it with "KATEGORİLER" in the bar — except on the catalog's own
 * pages, which open with it (see `lib/sidebar`).
 *
 * Open, it is exactly as tall as the hero beside it, whatever the window: the
 * list sits in a box pinned to the column's edges, so it adds nothing to the
 * row's height, which the hero alone sets (the column stretches to it). The
 * list scrolls inside that height, under a thin pale scrollbar that says there
 * is more below (`scroll-sidebar` in `globals.css`), so a long list never
 * holds the row open below the hero. Below `lg` it steps aside, where the same list is one
 * tap away in the bar's drawer.
 *
 * "KATEGORİLER" in that bar opens and closes it, and the choice is remembered (see
 * `lib/sidebar`): the `category-sidebar` class is what the CSS gives up the
 * width of, and the content beside it widens into the space. The right margin
 * belongs to the column rather than to a gap on the row, so collapsing takes
 * the gap with it.
 *
 * `fit` (the catalog's): no hero to match, so the column is as tall as its list
 * and no taller — its grey ends with the last row, and the page's white carries
 * on below it instead of an empty grey column down beside the grid.
 */
export function CategorySidebar({ items, fit = false }: { items: ResolvedNav[]; fit?: boolean }) {
  return (
    <nav
      aria-label="Kategoriler"
      className={`category-sidebar hidden shrink-0 ${SIDEBAR_WIDTH} lg:mr-6 lg:block lg:overflow-hidden lg:rounded-xl lg:bg-background ${
        fit ? "lg:h-fit lg:self-start" : "lg:relative lg:self-stretch"
      }`}
    >
      {/* No shell of its own: the list stands on the page's grey, held
          together by the hairlines between its rows. On a white page (the
          catalog's) that grey is the column's own, framing the page with the
          header. */}
      <div className={fit ? undefined : "scroll-sidebar lg:absolute lg:inset-0 lg:overflow-y-auto lg:overscroll-contain"}>
        {/* The list reads the current search to mark a brand row; on a static
            page that is known after hydration, so it waits for it. */}
        <Suspense fallback={<CategoryListSkeleton count={items.length} />}>
          <CategoryList items={items} />
        </Suspense>
      </div>
    </nav>
  );
}

/** The same rows at the same heights, so nothing moves when they arrive. */
function CategoryListSkeleton({ count }: { count: number }) {
  return (
    <ul aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="h-11 border-b border-border last:border-0" />
      ))}
    </ul>
  );
}
