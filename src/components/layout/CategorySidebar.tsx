import { Suspense } from "react";

import { CategoryList } from "@/components/layout/CategoryList";
import type { ResolvedNav } from "@/lib/storefrontNav";

/**
 * The category column's width — shared with the "KATAGORİLER" cell above it and
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
 * The surface both navigations are cut from: a graphite wash, lit along its
 * top edge and settling a shade darker at the foot.
 *
 * Flat white put the menus on the same plane as every card on the page and on
 * no plane at all beside the hero. Obsidian would have gone the other way —
 * the darkest thing on a light page, competing with the hero rather than
 * framing it. A tinted platinum keeps the white pills reading as raised keys
 * on a tray, which is the whole point of the tactile treatment.
 *
 * Written out in full, and shared, so the dock and the column cannot drift.
 */
export const NAV_SURFACE = [
  // Frosted glass: a quarter-strength stone grey behind a blur, so the bed is
  // mostly whatever is behind it. Over the page it composites to about
  // rgb(216,217,218) — light by design; the weight comes from the specular
  // rim and the cast below rather than from the tint itself.
  //
  // Written as an opacity modifier on a hex (`bg-[#82848a]/25`) rather than
  // an `rgba(…)` arbitrary value: both compile, but this form keeps the
  // colour and its strength legible as separate numbers.
  "border border-white/50 bg-[#82848a]/25 backdrop-blur-xl backdrop-saturate-150",
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_20px_rgba(0,0,0,0.05)]",
  "dark:border-white/15",
].join(" ");

/**
 * Kategoriler: the column down the left of the storefront, open at all times.
 *
 * Every category the shop leads with is on screen — no hover, nothing to
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
 * "KATAGORİLER" in that bar collapses it, and the choice is remembered (see
 * `lib/sidebar`): the `category-sidebar` class is what the CSS gives up the
 * width of, and the content beside it widens into the space. The right margin
 * belongs to the column rather than to a gap on the row, so collapsing takes
 * the gap with it.
 */
export function CategorySidebar({ items }: { items: ResolvedNav[] }) {
  return (
    <nav
      aria-label="Kategoriler"
      className={`category-sidebar hidden shrink-0 rounded-3xl ${SIDEBAR_WIDTH} lg:mr-6 lg:block lg:h-max lg:self-start`}
    >
      {/* The shell the pills sit in: soft, rounded and a shade off the page,
          so the column reads as one object rather than a list against nothing.
          The column scrolls on short windows, which makes it a clipping box;
          its own rounded-3xl is what keeps that clip from cutting the shell's
          shadow into square corners. */}
      <div className={`space-y-2 rounded-3xl p-3 ${NAV_SURFACE}`}>
        {/* The list reads the current search to mark a brand row; on a static
            page that is known after hydration, so it waits for it. */}
        <Suspense fallback={<CategoryListSkeleton count={items.length} />}>
          <CategoryList items={items} />
        </Suspense>
      </div>
    </nav>
  );
}

/** The same pills at the same heights, so nothing moves when they arrive. */
function CategoryListSkeleton({ count }: { count: number }) {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="h-9 rounded-xl border border-neutral-200/70 bg-white dark:border-white/10 dark:bg-neutral-800/90" />
      ))}
    </ul>
  );
}
