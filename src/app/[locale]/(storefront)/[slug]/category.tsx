import type { Metadata } from "next";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { categoryCopy, categoryFamily, hasCategoryCopy, parentCategory } from "@/lib/categories";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import type { getI18n } from "@/lib/i18n/server";
import { getBrands, getPublicProducts } from "@/lib/server/catalog";
import { categoryDescription, categoryHref, leadParagraph, metaDescription, pageMetadata } from "@/lib/seo";
import type { Category } from "@/types";

/*
 * A category's page, drawn at the root (/<slug>) by the page beside this
 * module, which tells a category's slug from a product's. Until 2026-10-29 it
 * was /catalog/<slug>, which now answers with a 301 here (src/proxy.ts).
 */

type I18n = Awaited<ReturnType<typeof getI18n>>;

export async function categoryMetadata(category: Category, { locale, t }: I18n): Promise<Metadata> {
  // The same request the page makes, so the data cache answers it once.
  const products = await getPublicProducts(category.slug);
  // The admin's own introduction (in the page's language: the API answers
  // with its translation), else written copy where the shop has it (in all
  // three languages, lib/categories), else built from what the category
  // sells, so no two categories share one description.
  const description = category.description
    ? metaDescription(leadParagraph(category.description))
    : hasCategoryCopy(category.slug)
      ? categoryCopy(category.slug, locale).description
      : categoryDescription(category, products, locale);
  return pageMetadata({
    title: t.meta.categoryTitle(category.name),
    description,
    href: categoryHref(category.slug),
    locale,
    locales: category.locales,
    // The category's own photo, else its first products' — a link shared on
    // WhatsApp shows what the category sells.
    images: [category.image_url, ...(products ?? []).slice(0, 3).map((p) => p.image_url)],
    imageAlt: category.name,
    // An empty category is a thin page: reachable, but not one to index.
    noindex: products !== null && products.length === 0,
  });
}

export async function CategoryPage({
  category,
  categories,
  locale,
  t,
}: { category: Category; categories: Category[] } & I18n & { locale: Locale }) {
  const slug = category.slug;
  const [products, brands] = await Promise.all([getPublicProducts(slug), getBrands()]);
  const name = category.name;
  const parent = parentCategory(category, categories);
  return (
    <CatalogScreen
      title={name}
      breadcrumbs={[
        // Ana Sayfa > (Grup >) Kategori, the first steps of the product's own trail.
        { name: t.nav.crumbHome, href: "/" },
        ...(parent ? [{ name: parent.name, href: categoryHref(parent.slug) }] : []),
        { name, href: categoryHref(slug) },
      ]}
      family={categoryFamily(category, categories)}
      categories={categories}
      activeCategory={category}
      products={products}
      brands={brands ?? []}
      // The admin's introduction, else the shop's written copy where it has
      // one (the meta description's generated fallback is for search
      // results, not the page). Long text is clamped, all of it in the HTML.
      intro={category.description || (hasCategoryCopy(slug) ? categoryCopy(slug, locale).description : null)}
      // Its own passage at the foot, in place of the shop's: written in
      // Turkish, so the Turkish page's only.
      closing={
        locale === DEFAULT_LOCALE && (category.seo_title?.trim() || category.seo_text?.trim())
          ? { title: category.seo_title?.trim() || category.name, html: category.seo_text?.trim() || null }
          : null
      }
    />
  );
}
