/**
 * Choosing between a product's colours.
 *
 * A colour is a variant, with its own stock, so "is this product available?" and
 * "which price does the card show?" are questions about a *set* of variants. One
 * place answers them, so the card, the product page and the structured data
 * never disagree about which colour they are talking about.
 */

import type { CatalogProduct, CatalogVariant } from "@/types";

/** Absent `in_stock` (an older cached payload) counts as available. */
export const variantInStock = (variant: CatalogVariant) => variant.in_stock !== false;

/** The product has more than one colour to choose between. */
export const hasColorChoice = (product: Pick<CatalogProduct, "variants">) =>
  product.variants.length > 1;

/**
 * The colour a list card, or the structured data, should speak for: the first
 * one that can actually be bought, falling back to the first that exists so a
 * sold-out product still shows its name, price and photo.
 */
export function displayVariant(product: Pick<CatalogProduct, "variants">): CatalogVariant | undefined {
  return product.variants.find(variantInStock) ?? product.variants[0];
}

/** Every colour is out of stock (or the product has no variants at all). */
export const soldOut = (product: Pick<CatalogProduct, "variants">) =>
  !product.variants.some(variantInStock);

/** The colour the product page opens on: the first in stock, else the first. */
export function initialVariantId(product: Pick<CatalogProduct, "variants">): string | null {
  return displayVariant(product)?.id ?? null;
}

/** A variant by id, or the page's default when the id is stale or missing. */
export function resolveVariant(
  product: Pick<CatalogProduct, "variants">,
  variantId: string | null,
): CatalogVariant | undefined {
  return product.variants.find((v) => v.id === variantId) ?? displayVariant(product);
}
