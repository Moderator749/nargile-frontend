import type { Metadata } from "next";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/config";
import type { getI18n } from "@/lib/i18n/server";
import { textToHtml } from "@/lib/richText";
import { brandDescription, brandHref, metaDescription, pageMetadata } from "@/lib/seo";
import { getBrandProducts } from "@/lib/server/catalog";
import type { Brand, CatalogProduct, Category } from "@/types";

/*
 * A brand's page, drawn at the root (/<slug>) by the page beside this module:
 * every product the brand makes, its sets first, with a chip for each kind
 * of product it holds. Until 2026-10-29 it was /marka/<slug>, which leads
 * here (app/[locale]/(storefront)/marka/[slug]).
 */

type I18n = Awaited<ReturnType<typeof getI18n>>;

/** The admin's own words about the brand ("Markalar"): written in Turkish, so the Turkish page's only. */
const ownDescription = (brand: { description?: string | null }, locale: string) =>
  locale === DEFAULT_LOCALE && !!brand.description?.trim();

/**
 * The kinds of product among `products`: each one's group (its category's
 * parent, or the category itself at the top), in the menu's order, with every
 * category id that falls under it.
 */
function groupsOf(products: CatalogProduct[], categories: Category[]) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const groupOf = (id: number | null) => {
    const category = id != null ? byId.get(id) : undefined;
    return category ? (category.parent_id != null ? byId.get(category.parent_id) ?? category : category) : undefined;
  };
  const present = new Map<number, Category>();
  for (const p of products) {
    const group = groupOf(p.category_id);
    if (group) present.set(group.id, group);
  }
  return [...present.values()]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "tr"))
    .map((g) => ({
      slug: g.slug,
      name: g.name,
      ids: [g.id, ...categories.filter((c) => c.parent_id === g.id).map((c) => c.id)],
    }));
}

export async function brandMetadata(brand: Brand, { locale, t }: I18n): Promise<Metadata> {
  const { products } = await getBrandProducts(brand);
  return pageMetadata({
    title: t.meta.brandTitle(brand.name),
    description: ownDescription(brand, locale) ? metaDescription(brand.description) : brandDescription(brand, products, locale),
    href: brandHref(brand.slug),
    locale,
    // A brand's page is in a language when its products are: a page of
    // Turkish product names under /en is not an English page.
    locales: LOCALES.filter((l) => (products ?? []).some((p) => p.locales?.includes(l))),
    images: [brand.logo_url, ...(products ?? []).slice(0, 3).map((p) => p.image_url)],
    imageAlt: brand.name,
    // A brand with nothing on sale is a page with no content: reachable from
    // the menu, never in the index.
    noindex: products !== null && products.length === 0,
  });
}

export async function BrandPage({
  brand,
  brands,
  categories,
  locale,
  t,
}: { brand: Brand; brands: Brand[]; categories: Category[] } & I18n & { locale: Locale }) {
  const { products, byRelation } = await getBrandProducts(brand);
  return (
    <CatalogScreen
      title={t.meta.brandHeading(brand.name)}
      // Plain text as the admin wrote it: escaped into paragraphs, never markup.
      intro={ownDescription(brand, locale) ? textToHtml(brand.description ?? "") : null}
      breadcrumbs={[
        { name: t.nav.crumbHome, href: "/" },
        { name: brand.name, href: brandHref(brand.slug) },
      ]}
      categories={categories}
      activeCategory={null}
      products={products}
      brands={brands}
      brand={brand}
      brandByRelation={byRelation}
      groups={products ? groupsOf(products, categories) : undefined}
    />
  );
}
