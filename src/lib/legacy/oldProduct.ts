/**
 * Where an old product address (/product/<slug>, an OpenCart slug) ends up,
 * worked out in one go so the proxy answers with a single 301 to the final
 * page rather than a 301 to /<slug> that the product page then redirects
 * again. The order is the product page's own (app/[locale]/(storefront)/
 * [slug]/page.tsx): the product on sale under its current slug, else its
 * hand-picked successor (RETIRED_PRODUCTS), else the category of a product
 * taken off sale (GET /products/{ref}/shelf).
 *
 * Kept free of runtime imports so `npm test` runs it as is; the proxy hands
 * in the lookups.
 */

/** A lookup the API could not answer: down, slow, a 5xx, or not JSON. */
export const UNAVAILABLE = Symbol("unavailable");

export type Lookup = string | null | typeof UNAVAILABLE;

export interface OldProductLookups {
  /** The current slug of the published product this ref names; null when none. */
  current: (ref: string) => Promise<Lookup>;
  /** RETIRED_PRODUCTS[ref]: an address of ours (old /product/… or /catalog/… spellings allowed). */
  retired: (ref: string) => string | undefined;
  /** The category slug of a product taken off sale; null when none. Optional: without it, no shelf step. */
  shelf?: (ref: string) => Promise<Lookup>;
}

/** An address from RETIRED_PRODUCTS at the root, as pages are addressed now. */
export function atRoot(address: string): string {
  return address.replace(/^\/(?:product|catalog)\//, "/");
}

/**
 * The final path for an old product's ref (without a language prefix), or
 * UNAVAILABLE when the API could not say, or null when nothing is known of it.
 */
export async function oldProductTarget(ref: string, lookups: OldProductLookups): Promise<Lookup> {
  const current = await lookups.current(ref);
  if (current === UNAVAILABLE) return UNAVAILABLE;
  if (current) return `/${current}`;
  const retired = lookups.retired(ref);
  if (retired) return atRoot(retired);
  if (!lookups.shelf) return null;
  const shelf = await lookups.shelf(ref);
  if (shelf === UNAVAILABLE) return UNAVAILABLE;
  return shelf ? `/${shelf}` : null;
}
