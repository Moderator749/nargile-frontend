import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { brandCanonical, brandDescription, brandHref, pageMetadata } from "@/lib/seo";
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
  const brand = brands.find((b) => b.slug === slug && b.is_active) ?? null;
  const products = brand ? await getPublicProducts(undefined, undefined, 0, brand.search_term) : null;
  return { brands, brand, products };
}

export async function generateMetadata(props: PageProps<"/marka/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const [{ brand, products }, categories] = await Promise.all([load(slug), getCategories()]);
  if (!brand) return { title: "Marka bulunamadı", robots: { index: false } };

  return pageMetadata({
    title: `${brand.name} Nargile Ürünleri ve Fiyatları`,
    description: brandDescription(brand, products),
    href: brandCanonical(brand.slug, categories),
    images: [brand.logo_url, ...(products ?? []).slice(0, 3).map((p) => p.image_url)],
    imageAlt: brand.name,
    // A brand with nothing on sale (the tobacco brands, for one) is a page
    // with no content: reachable from the menu, never in the index.
    noindex: products !== null && products.length === 0,
  });
}

export default async function BrandPage(props: PageProps<"/marka/[slug]">) {
  const { slug } = await props.params;
  const [{ brands, brand, products }, categories] = await Promise.all([load(slug), getCategories()]);
  if (!brand) notFound();

  return (
    <CatalogScreen
      title={`${brand.name} Ürünleri`}
      breadcrumbs={[
        { name: "Ana Sayfa", href: "/" },
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
