// The product page's internal links: "Benzer Ürünler" and "İlgili Kategoriler".

import type { Locale } from "@/lib/i18n/config";
import { productMessages } from "@/lib/i18n/messages/product";
import { brandHref, categoryHref } from "@/lib/seo";
import type { Brand, CatalogProduct, CatalogProductDetail, Category } from "@/types";

/** How many similar products the page shows: two rows of four on a wide screen. */
export const SIMILAR_COUNT = 8;
/** How many category links: enough to be useful, few enough to stay a row or two. */
export const RELATED_CATEGORY_COUNT = 8;

/**
 * "Benzer Ürünler": the products after this one in its category's list (by
 * name, which keeps a brand's series together), wrapping round to the start.
 *
 * Neighbours rather than the category's first few: those would be the same
 * eight on every page of the category, and the rest would never be linked
 * from anywhere. This way every product is a neighbour of the ones before it.
 * The product itself and the ones already pinned under it are skipped.
 */
export function pickSimilar(
  list: CatalogProduct[],
  product: CatalogProductDetail,
  count = SIMILAR_COUNT,
): CatalogProduct[] {
  const skip = new Set([product.id, ...(product.cross_sells ?? []).map((p) => p.id)]);
  const at = list.findIndex((p) => p.id === product.id);
  const start = at === -1 ? 0 : at + 1;
  const ordered = [...list.slice(start), ...list.slice(0, start)];
  return ordered.filter((p) => !skip.has(p.id)).slice(0, count);
}

export interface RelatedLink {
  name: string;
  href: string;
}

/**
 * "İlgili Kategoriler": where else to look from this product — the categories
 * it is listed under, its category's parent and the categories beside it
 * (same parent, or the other top-level ones), then the brand's own page. Only
 * categories with something on sale, each once, the product's own first.
 */
export function relatedCategories(
  product: CatalogProductDetail,
  categories: Category[],
  brands: Brand[],
  count = RELATED_CATEGORY_COUNT,
  /** The page's language, for the brand link's words. */
  locale: Locale = "tr",
): RelatedLink[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const stocked = (c: Category | undefined): c is Category => !!c && (c.product_count ?? 1) > 0;
  const own = (product.category_ids?.length ? product.category_ids : [product.category_id])
    .map((id) => (id != null ? byId.get(id) : undefined))
    .filter(stocked);
  const primary = own[0];
  const parent = primary?.parent_id != null ? byId.get(primary.parent_id) : undefined;
  const siblings = primary
    ? categories.filter((c) => c.parent_id === primary.parent_id && c.id !== primary.id && stocked(c))
    : categories.filter((c) => c.parent_id === null && stocked(c));

  const links: RelatedLink[] = [];
  const seen = new Set<string>();
  const add = (link: RelatedLink) => {
    if (seen.has(link.href)) return;
    seen.add(link.href);
    links.push(link);
  };
  for (const c of [...own, ...(stocked(parent) ? [parent] : []), ...siblings]) {
    add({ name: c.name, href: categoryHref(c.slug) });
  }
  const shown = links.slice(0, count);

  // The brand's page last, kept even when the categories filled the row: it
  // is the one link a shopper who likes this product most often wants.
  // By the brand the product belongs to; by its name on an API from before the relation.
  const brand = product.brand_slug
    ? brands.find((b) => b.is_active && b.slug === product.brand_slug)
    : product.brand
      ? brands.find((b) => b.is_active && b.name.toLocaleLowerCase("tr") === product.brand!.toLocaleLowerCase("tr"))
      : undefined;
  if (brand) {
    const href = brandHref(brand.slug);
    if (!shown.some((link) => link.href === href)) shown.push({ name: productMessages[locale].allOfBrand(brand.name), href });
  }
  return shown;
}
