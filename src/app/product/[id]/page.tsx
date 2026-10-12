import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/product/ProductDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { categoryCopy } from "@/lib/categories";
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

  // "Açıklama ve SEO" wins when the admin filled it in; otherwise the page falls
  // back to the description, then to the category's standing copy.
  // A meta title the admin wrote is the whole <title>, suffix included if they
  // want one, so it bypasses the layout's "%s | <shop>" template (title.absolute).
  const metaTitle = product.meta_title?.trim();
  const description =
    product.meta_description?.trim() ||
    product.description?.slice(0, 160) ||
    `${product.name}${category ? ` · ${category.name}` : ""}. ${categoryCopy(category?.slug).description}`.slice(0, 160);
  const href = productHref(product.id);
  return {
    title: metaTitle ? { absolute: metaTitle } : product.name,
    description,
    alternates: { canonical: href },
    openGraph: {
      title: metaTitle || `${product.name} | ${SITE_NAME}`,
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

  // Ana Sayfa > Kategori > Ürün: the path a visitor takes from a menu to here.
  const crumbs: Breadcrumb[] = [
    { name: "Ana Sayfa", href: "/" },
    ...(category ? [{ name: category.name, href: `/catalog/${category.slug}` }] : []),
    { name: product.name, href: productHref(product.id) },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd data={productJsonLd(product, category)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ProductDetail initialProduct={product} category={category} categories={categories} breadcrumbs={crumbs} />
    </main>
  );
}
