import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { brandForSlug } from "@/lib/brandMatch";
import { DEFAULT_LOCALE, LOCALES, localePath } from "@/lib/i18n/config";
import { textToHtml } from "@/lib/richText";
import { getI18n } from "@/lib/i18n/server";
import { brandCanonical, brandDescription, brandHref, metaDescription, pageMetadata } from "@/lib/seo";
import { getBrands, getCategories, getPublicProducts, required } from "@/lib/server/catalog";

// A day, as the catalog (CATALOG_REVALIDATE); admin edits refresh it immediately.
export const revalidate = 86400;

/** Prerender the brand list; a brand added later renders on first request. */
export async function generateStaticParams() {
  return ((await getBrands()) ?? []).map((b) => ({ slug: b.slug }));
}

/**
 * A brand and its first page of products. The products are the brand's
 * search term's results — the same ones the brand rows in the category column
 * always showed — so a brand page and a search for it never disagree.
 */
async function load(slug: string) {
  // Throws when the API is down, so an outage is never a 404.
  const brands = required(await getBrands(), "/brands");
  // Another spelling of a brand ("legend-hookah", "mr.wood") finds it too; the page then moves to its own address.
  const brand = brandForSlug(slug, brands) ?? null;
  const products = brand ? await getPublicProducts(undefined, undefined, 0, brand.search_term) : null;
  return { brands, brand, products };
}

/** The admin's own words about the brand ("Markalar"): written in Turkish, so the Turkish page's only. */
const ownDescription = (brand: { description?: string | null }, locale: string) =>
  locale === DEFAULT_LOCALE && !!brand.description?.trim();

export async function generateMetadata(props: PageProps<"/[locale]/marka/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const [{ brand, products }, categories, { locale, t }] = await Promise.all([load(slug), getCategories(), getI18n()]);
  if (!brand) return { title: t.meta.brandNotFound, robots: { index: false } };

  return pageMetadata({
    title: t.meta.brandTitle(brand.name),
    description: ownDescription(brand, locale) ? metaDescription(brand.description) : brandDescription(brand, products, locale),
    href: brandCanonical(brand.slug, categories),
    locale,
    // A brand's page is in a language when its products are: a page of
    // Turkish product names under /en is not an English page.
    locales: LOCALES.filter((l) => (products ?? []).some((p) => p.locales?.includes(l))),
    images: [brand.logo_url, ...(products ?? []).slice(0, 3).map((p) => p.image_url)],
    imageAlt: brand.name,
    // A brand with nothing on sale (the tobacco brands, for one) is a page
    // with no content: reachable from the menu, never in the index.
    noindex: products !== null && products.length === 0,
  });
}

export default async function BrandPage(props: PageProps<"/[locale]/marka/[slug]">) {
  const { slug } = await props.params;
  const [{ brands, brand, products }, categories, { locale, t }] = await Promise.all([load(slug), getCategories(), getI18n()]);
  if (!brand) notFound();
  if (brand.slug !== slug) permanentRedirect(localePath(locale, brandHref(brand.slug)));

  return (
    <CatalogScreen
      title={t.meta.brandHeading(brand.name)}
      // Plain text as the admin wrote it: escaped into paragraphs, never markup.
      intro={ownDescription(brand, locale) ? textToHtml(brand.description ?? "") : null}
      breadcrumbs={[
        { name: t.nav.home, href: "/" },
        { name: brand.name, href: brandHref(brand.slug) },
      ]}
      categories={categories ?? []}
      activeCategory={null}
      products={products}
      brands={brands}
      brand={brand}
    />
  );
}
