import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { hasCategoryCopy, categoryCopy } from "@/lib/categories";
import { getBrands, getCategories, getCategoryBySlug, getPublicProducts } from "@/lib/server/catalog";
import { categoryDescription, metaDescription, pageMetadata } from "@/lib/seo";

// A day, as the catalog (CATALOG_REVALIDATE); admin edits refresh it immediately.
export const revalidate = 86400;

/** Prerender known categories; new ones render on first request (dynamicParams). */
export async function generateStaticParams() {
  const categories = (await getCategories()) ?? [];
  return categories.map((c) => ({ category: c.slug }));
}

async function findCategory(slug: string) {
  const categories = await getCategories();
  return { categories, category: categories?.find((c) => c.slug === slug) ?? null };
}

export async function generateMetadata(props: PageProps<"/catalog/[category]">): Promise<Metadata> {
  const { category: slug } = await props.params;
  // The same request the page makes, so the data cache answers it once.
  const [{ category }, products] = await Promise.all([findCategory(slug), getPublicProducts(slug)]);
  if (!category) return { title: "Kategori bulunamadı", robots: { index: false } };

  // The admin's own introduction, else written copy where the shop has it,
  // else built from what the category sells, so no two categories share one
  // description.
  const description = category.description
    ? metaDescription(category.description)
    : hasCategoryCopy(category.slug)
      ? categoryCopy(category.slug).description
      : categoryDescription(category, products);
  return pageMetadata({
    title: `${category.name} Modelleri ve Fiyatları`,
    description,
    href: `/catalog/${category.slug}`,
    // The category's own photo, else its first products' — a link shared on
    // WhatsApp shows what the category sells.
    images: [category.image_url, ...(products ?? []).slice(0, 3).map((p) => p.image_url)],
    imageAlt: category.name,
    // An empty category is a thin page: reachable, but not one to index.
    noindex: products !== null && products.length === 0,
  });
}

export default async function CategoryPage(props: PageProps<"/catalog/[category]">) {
  const { category: slug } = await props.params;
  const [{ categories, category }, products, brands] = await Promise.all([
    findCategory(slug),
    getPublicProducts(slug),
    getBrands(),
  ]);
  // Only 404 when the category list loaded and the slug isn't in it; if the API is
  // down we can't tell, so render the shell and let the client retry. A slug
  // the admin has since changed leads on to the category's current address.
  if (categories && !category) {
    const renamed = await getCategoryBySlug(slug);
    if (renamed && renamed.slug !== slug) permanentRedirect(`/catalog/${renamed.slug}`);
    notFound();
  }

  const name = category?.name ?? "Kategori";
  return (
    <CatalogScreen
      title={name}
      breadcrumbs={[
        // Ana Sayfa > Kategori, the first two steps of Ana Sayfa > Kategori > Ürün.
        { name: "Ana Sayfa", href: "/" },
        { name, href: `/catalog/${slug}` },
      ]}
      categories={categories ?? []}
      activeCategory={category ?? { id: -1, name, slug, parent_id: null }}
      products={products}
      brands={brands ?? []}
      // The admin's introduction, else the shop's written copy where it has
      // one (the meta description's generated fallback is for search
      // results, not the page). Long text is clamped, all of it in the HTML.
      intro={category?.description || (hasCategoryCopy(slug) ? categoryCopy(slug).description : null)}
    />
  );
}
