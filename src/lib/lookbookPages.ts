/**
 * How the price catalogue ("Fiyat Listesi") is cut into A4 pages: four plates
 * a page, and each page laid out for the plates it actually holds — so a lone
 * product, or the two or three left over at the end, fill their page instead
 * of sitting in a corner of a grid built for four.
 *
 * - 1: "single" — one plate, the whole page.
 * - 2: "pair"   — two plates stacked, each the full width and half the page.
 * - 3: "trio"   — two side by side above, the third the full width below.
 * - 4: "quad"   — two by two.
 *
 * Kept free of React and of path aliases so `node --test` runs it as is.
 */

export const PLATES_PER_PAGE = 4;

export type PageLayout = "single" | "pair" | "trio" | "quad";

/** How a plate is drawn in its slot: upright (a grid cell), across a full-width row, or the whole page. */
export type PlateShape = "tall" | "wide" | "hero";

export interface LookbookPage<T> {
  layout: PageLayout;
  /** One per item, in order: the shape its slot gives it. */
  slots: { item: T; shape: PlateShape }[];
}

const LAYOUT: Record<number, PageLayout> = { 1: "single", 2: "pair", 3: "trio", 4: "quad" };

const SHAPES: Record<PageLayout, PlateShape[]> = {
  single: ["hero"],
  pair: ["wide", "wide"],
  trio: ["tall", "tall", "wide"],
  quad: ["tall", "tall", "tall", "tall"],
};

/** The layout for a page holding `count` plates (1 to `PLATES_PER_PAGE`). */
export function pageLayout(count: number): PageLayout {
  const layout = LAYOUT[count];
  if (!layout) throw new RangeError(`A page holds 1 to ${PLATES_PER_PAGE} plates, not ${count}`);
  return layout;
}

/** The items as pages of up to four, in order, each with its layout and every plate's shape. */
export function lookbookPages<T>(items: readonly T[]): LookbookPage<T>[] {
  const pages: LookbookPage<T>[] = [];
  for (let i = 0; i < items.length; i += PLATES_PER_PAGE) {
    const chunk = items.slice(i, i + PLATES_PER_PAGE);
    const layout = pageLayout(chunk.length);
    pages.push({ layout, slots: chunk.map((item, n) => ({ item, shape: SHAPES[layout][n] })) });
  }
  return pages;
}
