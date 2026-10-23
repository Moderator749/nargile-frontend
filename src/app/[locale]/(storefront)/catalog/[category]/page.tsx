import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { brandForCategory } from "@/lib/brandMatch";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { hasCategoryCopy, categoryCopy } from "@/lib/categories";
import { getBrands, getCategories, getCategoryBySlug, getPublicProducts, required } from "@/lib/server/catalog";
import { categoryDescription, metaDescription, pageMetadata } from "@/lib/seo";

// A day, as the catalog (CATALOG_REVALIDATE); admin edits refresh it immediately.
export const revalidate = 86400;

/** Prerender known categories; new ones render on first request (dynamicParams). */
export async function generateStaticParams() {
  const categories = (await getCategories()) ?? [];
  return categories.map((c) => ({ category: c.slug }));
}

/** The category this slug names; throws when the API is down, so an outage is never a 404. */
async function findCategory(slug: string) {
  const categories = required(await getCategories(), "/categories");
  return { categories, category: categories.find((c) => c.slug === slug) ?? null };
}

export async function generateMetadata(props: PageProps<"/[locale]/catalog/[category]">): Promise<Metadata> {
  const { category: slug } = await props.params;
  // The same request the page makes, so the data cache answers it once.
  const [{ category }, products, { locale, t }] = await Promise.all([findCategory(slug), getPublicProducts(slug), getI18n()]);
  if (!category) return { title: t.meta.categoryNotFound, robots: { index: false } };

  // The admin's own introduction (in the page's language: the API answers
  // with its translation), else written copy where the shop has it (in all
  // three languages, lib/categories), else built from what the category
  // sells, so no two categories share one description.
  const description = category.description
    ? metaDescription(category.description)
    : hasCategoryCopy(category.slug)
      ? categoryCopy(category.slug, locale).description
      : categoryDescription(category, products, locale);
  return pageMetadata({
    title: t.meta.categoryTitle(category.name),
    description,
    href: `/catalog/${category.slug}`,
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

export default async function CategoryPage(props: PageProps<"/[locale]/catalog/[category]">) {
  const { category: slug } = await props.params;
  const [{ categories, category }, products, brands, { locale, t }] = await Promise.all([
    findCategory(slug),
    getPublicProducts(slug),
    getBrands(),
    getI18n(),
  ]);
  // A slug the admin has since changed leads on to the category's current
  // address; one the API does not know at all is a 404.
  if (!category) {
    const renamed = await getCategoryBySlug(slug);
    if (renamed && renamed.slug !== slug) permanentRedirect(localePath(locale, `/catalog/${renamed.slug}`));
    notFound();
  }

  const name = category.name;
  return (
    <CatalogScreen
      title={name}
      breadcrumbs={[
        // Ana Sayfa > Kategori, the first two steps of Ana Sayfa > Kategori > Ürün.
        { name: t.nav.home, href: "/" },
        { name, href: `/catalog/${slug}` },
      ]}
      categories={categories}
      activeCategory={category}
      products={products}
      brands={brands ?? []}
      // A category that is a brand's page ("Legend Hookah") wears its logo.
      logo={brandForCategory(category, brands ?? [])?.logo_url}
      // The admin's introduction, else the shop's written copy where it has
      // one (the meta description's generated fallback is for search
      // results, not the page). Long text is clamped, all of it in the HTML.
      intro={category.description || (hasCategoryCopy(slug) ? categoryCopy(slug, locale).description : null)}
    />
  );
}
