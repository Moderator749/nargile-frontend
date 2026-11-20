// "Stokta Benzer Alternatifler": what a shelf that has (almost) nothing to sell
// offers instead, under its grid. Mr. Wood (2026-11-20) got ~80 Google clicks
// a week onto four sold-out sets and one spare bottle: zero add-to-carts.

import type { CatalogProduct } from "@/types";

// lib/variants' soldOut, inlined so `npm test` can load this module as is:
// every colour sold out (an absent `in_stock` counts as available).
const soldOut = (p: Pick<CatalogProduct, "variants">) => !p.variants.some((v) => v.in_stock !== false);

/** At most two rows of four, as "Benzer Ürünler". */
export const ALTERNATIVES_MAX = 8;
/** Fewer than this many is not a choice; the shelf stays away. */
export const ALTERNATIVES_MIN = 4;

/**
 * Where a shelf's alternatives come from first, by its slug (the same kind of
 * thing, in stock): Mr. Wood's wooden classic sets → the classic cast sets,
 * among which the "Wood" and "Çam" models. Every other shelf, and these once
 * exhausted, draws from its parent's whole listing.
 */
export const PREFERRED_SHELVES: Record<string, string[]> = {
  "mr-wood": ["klasik-takimlar"],
};

/**
 * Whether the page is in effect sold out: fewer than ALTERNATIVES_MIN things
 * to buy, and more sold out than not — so an ordinary small shelf (three
 * products, all in stock) is left alone, and a big one only once it is down
 * to its last few.
 */
export function needsAlternatives(products: CatalogProduct[] | null): boolean {
  if (!products || products.length === 0) return false;
  const inStock = products.filter((p) => !soldOut(p)).length;
  return inStock < ALTERNATIVES_MIN && products.length - inStock > inStock;
}

// Words every set's name carries, which say nothing about which set it is.
const COMMON = new Set([
  "nargile", "takımı", "takimi", "takım", "şişe", "şişesi", "sise", "sisesi", "marpuç", "marpuc", "dahil",
  "model", "standart", "büyük", "küçük", "boy", "siyah", "beyaz", "kristal", "renkli",
]);

const words = (name: string) =>
  name
    .toLocaleLowerCase("tr-TR")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 4 && !COMMON.has(w));

/**
 * In-stock alternatives from `pools` (most preferred first), none already on
 * the page, each once — and one per name: the catalogue has a few twins
 * ("Döküm Nargile Takımı - Wood Model" twice), which would use two places on one choice. Those sharing a telling word with the page's sold-out
 * names ("wood", "classic") lead; the rest keep their pool's order.
 */
export function pickAlternatives(
  page: CatalogProduct[],
  pools: CatalogProduct[][],
  count = ALTERNATIVES_MAX,
): CatalogProduct[] {
  const onPage = new Set(page.map((p) => p.id));
  const wanted = new Set(page.filter(soldOut).flatMap((p) => words(p.name)));
  const seen = new Set<string>();
  const candidates: CatalogProduct[] = [];
  for (const pool of pools) {
    for (const p of pool) {
      const name = p.name.trim().toLocaleLowerCase("tr-TR");
      if (onPage.has(p.id) || seen.has(p.id) || seen.has(name) || soldOut(p)) continue;
      seen.add(p.id);
      seen.add(name);
      candidates.push(p);
    }
  }
  const matches = (p: CatalogProduct) => words(p.name).some((w) => wanted.has(w));
  return [...candidates.filter(matches), ...candidates.filter((p) => !matches(p))].slice(0, count);
}
