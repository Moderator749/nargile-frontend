/**
 * The catalog's own filtering and sorting, over the products already on screen.
 *
 * `GET /products/` takes a category and a search term and nothing else — no
 * price range, no stock flag, no ordering — so these run on the client, over
 * the page the API returned. That is the honest shape of it: they narrow what
 * has been loaded rather than query the whole catalogue, and "load more" keeps
 * feeding them.
 *
 * The price they compare is the one the card shows, taken from the same
 * helpers the card uses, so a product can never be filtered out by a figure
 * the visitor cannot see.
 */

import { saleState } from "@/lib/flashSale";
import type { Locale } from "@/lib/i18n/config";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { displayVariant, soldOut } from "@/lib/variants";
import type { CatalogProduct } from "@/types";

/** Only what the listing payload can actually answer; see SORT_OPTIONS. */
export type SortKey = "recommended" | "price-asc" | "price-desc" | "name-asc";

export interface CatalogFilters {
  /** Free text, as typed; empty means no bound. */
  min: string;
  max: string;
  inStock: boolean;
  sort: SortKey;
}

export const EMPTY_FILTERS: CatalogFilters = {
  min: "",
  max: "",
  inStock: false,
  sort: "recommended",
};

/** The Turkish labels; the toolbar shows each language's own (lib/i18n/messages/catalog). */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Önerilen" },
  { value: "price-asc", label: "Fiyat: Düşükten Yükseğe" },
  { value: "price-desc", label: "Fiyat: Yüksekten Düşüğe" },
  { value: "name-asc", label: "İsim: A – Z" },
];

/**
 * What the card prints, as a number in TRY, or null when the viewer has no
 * price for this product at all (not sold to their segment, or not converted).
 *
 * `now` is null before hydration, which keeps a live sale live — the same rule
 * the card follows, so the two never disagree about which price is current.
 */
export function cardPrice(product: CatalogProduct, now: number | null): number | null {
  const variant = displayVariant(product);
  const sale = saleState(product, variant, now);
  const price = sale.kind === "live" ? sale.price : (variant?.price ?? variant?.list_price ?? null);
  if (!price) return null;
  const value = Number(price.price_incl_tax);
  return Number.isFinite(value) ? value : null;
}

/** The cheapest and dearest on screen, for the range inputs' placeholders. */
export function priceBounds(products: CatalogProduct[], now: number | null) {
  const prices = products.map((p) => cardPrice(p, now)).filter((v): v is number => v !== null);
  if (prices.length === 0) return null;
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

/**
 * "1.299,90" and "1299.9" both read as a number; anything else is no bound.
 * In English and Arabic the comma groups thousands ("1,299.90"), as people
 * there write it.
 */
function bound(raw: string, locale: Locale): number | null {
  const compact = raw.replace(/\s/g, "");
  const cleaned =
    locale === "tr" ? compact.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".") : compact.replace(/,(?=\d{3}\b)/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function applyCatalogFilters(
  products: CatalogProduct[],
  { min, max, inStock, sort }: CatalogFilters,
  now: number | null,
  /** The page's language: how the price boxes read a number, and how names sort. */
  locale: Locale = "tr",
): CatalogProduct[] {
  const low = bound(min, locale);
  const high = bound(max, locale);

  const kept = products.filter((product) => {
    if (inStock && soldOut(product)) return false;
    if (low === null && high === null) return true;
    const price = cardPrice(product, now);
    // A product with no price for this viewer has nothing to compare: it stays
    // out of a range query rather than being asserted into it.
    if (price === null) return false;
    if (low !== null && price < low) return false;
    if (high !== null && price > high) return false;
    return true;
  });

  return lastIfSoldOut(sorted(kept, sort, now, locale));
}

function sorted(products: CatalogProduct[], sort: SortKey, now: number | null, locale: Locale): CatalogProduct[] {
  if (sort === "recommended") return products;
  if (sort === "name-asc") return [...products].sort((a, b) => a.name.localeCompare(b.name, INTL_LOCALE[locale]));

  // Priceless products sink to the bottom either way rather than sorting as 0.
  const direction = sort === "price-asc" ? 1 : -1;
  return [...products].sort((a, b) => {
    const pa = cardPrice(a, now);
    const pb = cardPrice(b, now);
    if (pa === null) return pb === null ? 0 : 1;
    if (pb === null) return -1;
    return (pa - pb) * direction;
  });
}

/**
 * Whatever the order, what cannot be bought goes last, in that same order.
 * The API already lists them so (`list_products`); this keeps it so when the
 * grid re-sorts by price or name.
 */
function lastIfSoldOut(products: CatalogProduct[]): CatalogProduct[] {
  return [...products.filter((p) => !soldOut(p)), ...products.filter((p) => soldOut(p))];
}
