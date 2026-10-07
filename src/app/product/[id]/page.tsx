import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/product/ProductDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { categoryCopy, topLevelOf } from "@/lib/categories";
import { breadcrumbJsonLd, productHref, productJsonLd, type Breadcrumb } from "@/lib/seo";
import { getCategories, getProduct } from "@/lib/server/catalog";
import { SITE_NAME } from "@/lib/site";

// Same freshness window as the catalog; admin edits refresh it immediately.
export const revalidate = 300;

async function load(id: string) {
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);
  const category = product?.category_id != null ? categories?.find((c) => c.id === product.category_id) : undefined;
  return { product, categories: categories ?? [], category };
}

export async function generateMetadata(props: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const { product, category } = await load(id);
  if (!product) return { title: "Ürün bulunamadı", robots: { index: false } };

  const description =
    product.description?.slice(0, 160) ||
    `${product.name}${category ? ` · ${category.name}` : ""}. ${categoryCopy(category?.slug).description}`.slice(0, 160);
  const href = productHref(product.id);
  return {
    title: product.name,
    description,
    alternates: { canonical: href },
    openGraph: {
      title: `${product.name} | ${SITE_NAME}`,
      description,
      url: href,
      ...(product.image_url ? { images: [{ url: product.image_url }] } : {}),
    },
  };
}

export default async function ProductPage(props: PageProps<"/product/[id]">) {
  const { id } = await props.params;
  const { product, categories, category } = await load(id);
  if (!product) notFound();

  const group = category ? topLevelOf(category, categories) : undefined;
  const crumbs: Breadcrumb[] = [
    { name: "Ana Sayfa", href: "/" },
    { name: "Katalog", href: "/catalog" },
    ...(group && group.id !== category?.id ? [{ name: group.name, href: `/catalog/${group.slug}` }] : []),
    ...(category ? [{ name: category.name, href: `/catalog/${category.slug}` }] : []),
    { name: product.name, href: productHref(product.id) },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd data={productJsonLd(product, category)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ProductDetail initialProduct={product} category={category} breadcrumbs={crumbs} />
    </main>
  );
}
