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
  "bento",
  "deals",
  "campaigns",
  "promos",
  "brands",
  "brand_showcase",
  "kozlukler",
  "games",
  "showcase",
  "about",
];

/**
 * The order to show: the saved one, cleaned of anything unknown or repeated,
 * with every section it does not name (one added since it was saved) put
 * where it sits by default: straight before the section it comes before
 * there — so a new section meant to sit above "Premium Ürün Yelpazesi" does,
 * wherever the admin has moved things — or last when nothing follows it.
 * With nothing saved, the default order.
 */
export function resolveBlockOrder(saved: readonly string[] | null | undefined): HomeBlock[] {
  const known = new Set<string>(HOME_BLOCKS);
  const order = [...new Set(saved ?? [])].filter((id): id is HomeBlock => known.has(id));
  HOME_BLOCKS.forEach((id, i) => {
    if (order.includes(id)) return;
    const next = HOME_BLOCKS.slice(i + 1).find((later) => order.includes(later));
    order.splice(next ? order.indexOf(next) : order.length, 0, id);
  });
  return order;
}
