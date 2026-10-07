import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { categoryCopy } from "@/lib/categories";
import { getCategories, getPublicProducts } from "@/lib/server/catalog";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 300;

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
  const { category } = await findCategory(slug);
  if (!category) return { title: "Kategori bulunamadı", robots: { index: false } };

  const title = `${category.name} — Toptan ve Bayi Fiyatları`;
  const description = categoryCopy(category.slug).description;
  const href = `/catalog/${category.slug}`;
  return {
    title,
    description,
    alternates: { canonical: href },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: href },
  };
}

export default async function CategoryPage(props: PageProps<"/catalog/[category]">) {
  const { category: slug } = await props.params;
  const [{ categories, category }, products] = await Promise.all([
    findCategory(slug),
    getPublicProducts(slug),
  ]);
  // Only 404 when the category list loaded and the slug isn't in it; if the API is
  // down we can't tell, so render the shell and let the client retry.
  if (categories && !category) notFound();

  const name = category?.name ?? "Kategori";
  const parent = category?.parent_id != null ? categories?.find((c) => c.id === category.parent_id) : undefined;
  return (
    <CatalogScreen
      title={name}
      breadcrumbs={[
        { name: "Ana Sayfa", href: "/" },
        { name: "Katalog", href: "/catalog" },
        ...(parent ? [{ name: parent.name, href: `/catalog/${parent.slug}` }] : []),
        { name, href: `/catalog/${slug}` },
      ]}
      categories={categories ?? []}
      activeCategory={category ?? { id: -1, name, slug, parent_id: null }}
      products={products}
    />
  );
}
