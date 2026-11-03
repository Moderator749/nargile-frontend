/**
 * A whole listing for a price catalogue, where the grid has it a page at a
 * time, and the catalogue's parts where it is longer than one file takes.
 * Pure, so `npm test` reads it as is; `fetchAllProducts` (catalogApi) is the
 * API's side.
 */

/**
 * What a catalogue's products are, for its count's sentence: the page's
 * category, brand, search or the whole catalog, the deals — or, with a filter
 * or a sub-category chip on, those of them it keeps.
 */
export type ListingScope = "category" | "brand" | "search" | "all" | "deals" | "filtered";

/** One file of a catalogue: its number and the products it holds, counted from 1. */
export interface CatalogPart {
  n: number;
  from: number;
  to: number;
}

/**
 * "356 ürün" → Bölüm 1 (1–200), Bölüm 2 (201–356): `max` to a file, in the
 * grid's order, so a part is the same products whichever device makes it.
 */
export function catalogParts(count: number, max: number): CatalogPart[] {
  const parts: CatalogPart[] = [];
  for (let from = 1; from <= count; from += max) {
    parts.push({ n: parts.length + 1, from, to: Math.min(from + max - 1, count) });
  }
  return parts;
}

/** A part's products (or ids): part 1 when `n` names none of them. */
export function partOf<T>(items: T[], n: number, max: number): { part: CatalogPart | null; items: T[] } {
  const parts = catalogParts(items.length, max);
  const part = parts.find((p) => p.n === n) ?? parts[0] ?? null;
  return { part, items: part ? items.slice(part.from - 1, part.to) : [] };
}

/** Enough to cover the largest catalogue many times over; a guard against a listing that never ends. */
const MAX_PAGES = 100;

/**
 * Every page of a listing, in its order: as many pages at once as `total`
 * says there are, then one at a time for as long as the last came back full
 * (the listing grew since it was counted, or there is no count). A product
 * that slid onto a second page meanwhile is kept once, where it came first.
 */
export async function collectAllPages<T extends { id: string }>(
  fetchPage: (skip: number, limit: number) => Promise<T[]>,
  total: number | null,
  pageSize: number,
): Promise<T[]> {
  const counted = Math.min(Math.max(1, Math.ceil((total ?? 0) / pageSize)), MAX_PAGES);
  const pages = await Promise.all(Array.from({ length: counted }, (_, i) => fetchPage(i * pageSize, pageSize)));
  while (pages[pages.length - 1].length === pageSize && pages.length < MAX_PAGES) {
    pages.push(await fetchPage(pages.length * pageSize, pageSize));
  }
  const seen = new Set<string>();
  return pages.flat().filter((item) => !seen.has(item.id) && (seen.add(item.id), true));
}
