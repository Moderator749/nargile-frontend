/**
 * The homepage's sections between the hero (always first: it holds the page's
 * h1 and the category column) and the footer (every page's, always last), in
 * the order the storefront shows them unless the admin has dragged them into
 * another in "Ana Sayfa Düzenleme › Bölümler". Mirrors `HomeBlock` in
 * app/schemas/homepage.py; each is also a switch in `HomeSections`.
 *
 * No path aliases here: `npm test` imports this file as it is.
 */

import type { HomeBlock } from "@/types";

export const HOME_BLOCKS: readonly HomeBlock[] = [
  "perks",
  "brands_top",
  "picks",
  "lules",
  "sultanpuan",
  "kumbara",
  "deals",
  "campaigns",
  "promos",
  "brands",
  "brand_showcase",
  "showcase",
  "about",
];

/**
 * The order to show: the saved one, cleaned of anything unknown or repeated,
 * with every section it does not name (one added since it was saved) put back
 * where it sits by default — straight after the section it follows there, or
 * first when that is the first. With nothing saved, the default order.
 */
export function resolveBlockOrder(saved: readonly string[] | null | undefined): HomeBlock[] {
  const known = new Set<string>(HOME_BLOCKS);
  const order = [...new Set(saved ?? [])].filter((id): id is HomeBlock => known.has(id));
  HOME_BLOCKS.forEach((id, i) => {
    if (order.includes(id)) return;
    const after = i === 0 ? -1 : order.indexOf(HOME_BLOCKS[i - 1]);
    order.splice(after + 1, 0, id);
  });
  return order;
}
