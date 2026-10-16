import { Suspense } from "react";

import { CategoryList } from "@/components/layout/CategoryList";
import type { ResolvedNav } from "@/lib/storefrontNav";

/**
 * The category column's width — shared with the "KATEGORİLER" cell above it and
 * with the header's logo block, so the column line runs straight down through
 * all three and the search bar starts exactly where "KAMPANYALAR" does.
 *
 * Written out rather than composed (`lg:${SIDEBAR_WIDTH}`) because Tailwind
 * finds its classes by reading the source: a class assembled at runtime is a
 * class that was never generated.
 */
export const SIDEBAR_WIDTH = "w-64";
export const SIDEBAR_WIDTH_LG = "lg:w-64";

/**
 * Kategoriler: the column down the left of the storefront, closed until the
 * visitor opens it with "KATEGORİLER" in the bar.
 *
 * Open, every category the shop leads with is on screen — no hover, nothing to
 * discover, and no scrollbar of its own: the column runs down the page with
 * the hero and the promos beside it and ends where their row does, at the
 * deals. Below `lg` it steps aside, where the same list is one tap away in
 * the bar's drawer.
 *
 * It hangs from the top of its row, level with the hero: `self-start h-max`
 * gives it its own height instead of the row's, and the empty space falls
 * below it. It stays under the header while the row scrolls by, and on a
 * window too short to show all of it the list scrolls inside the column
 * instead (see `globals.css`).
 *
 * "KATEGORİLER" in that bar opens and closes it, and the choice is remembered (see
 * `lib/sidebar`): the `category-sidebar` class is what the CSS gives up the
 * width of, and the content beside it widens into the space. The right margin
 * belongs to the column rather than to a gap on the row, so collapsing takes
 * the gap with it.
 */
export function CategorySidebar({ items }: { items: ResolvedNav[] }) {
  return (
    <nav
      aria-label="Kategoriler"
      className={`category-sidebar hidden shrink-0 ${SIDEBAR_WIDTH} lg:mr-6 lg:block lg:h-max lg:self-start`}
    >
      {/* No shell: the list stands on the page itself, held together by the
          hairlines between its rows. */}
      <div>
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
