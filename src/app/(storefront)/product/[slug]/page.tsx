import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { AdvantagesSection } from "@/components/home/AdvantagesSection";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { ProductDetail } from "@/components/product/ProductDetail";
import { RelatedCategories } from "@/components/product/RelatedCategories";
import { SimilarProducts } from "@/components/product/SimilarProducts";
import { JsonLd } from "@/components/seo/JsonLd";
import { categoryCopy } from "@/lib/categories";
import { breadcrumbJsonLd, metaDescription, pageMetadata, productHref, productJsonLd, type Breadcrumb } from "@/lib/seo";
import { PAGE_CONTAINER } from "@/lib/layout";
import { pickSimilar, relatedCategories } from "@/lib/related";
import { getBrands, getCategories, getCategoryProducts, getProduct } from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { nameWithCode } from "@/lib/slug";
import { resolveNav } from "@/lib/storefrontNav";
import { displayVariant, soldOut } from "@/lib/variants";

// Same freshness window as the catalog; admin edits refresh it immediately.
export const revalidate = 300;

async function load(slug: string) {
  const [product, categories] = await Promise.all([getProduct(slug), getCategories()]);
  const category = product?.category_id != null ? categories?.find((c) => c.id === product.category_id) : undefined;
  return { product, categories: categories ?? [], category };
}

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { product, category } = await load(slug);
  if (!product) return { title: "Ürün bulunamadı", robots: { index: false } };

  // "Açıklama ve SEO" wins when the admin filled it in; otherwise the page falls
  // back to the description, then to the category's standing copy.
  // A meta title the admin wrote is the whole <title>, suffix included if they
  // want one, so it bypasses the layout's "%s | <shop>" template (title.absolute).
  const metaTitle = product.meta_title?.trim();
  // The admin's own description as written; otherwise the product's text,
  // topped up with the category's standing copy when it is too short to say
  // anything (a one-line "Ürün Kodu: …" is common in the imported catalogue).
  const fallback = `${product.name}${product.brand ? `, ${product.brand}` : ""}${category ? ` · ${category.name}` : ""}. ${categoryCopy(category?.slug).description}`;
  const own = metaDescription(product.description);
  const description =
    product.meta_description?.trim() || metaDescription(own.length >= 70 ? own : `${own ? `${own} ` : ""}${fallback}`);
  // "<Ürün> — <Marka> | <Mağaza>": the brand is what people search with, so
  // it goes in the title unless the name already says it.
  const brandSuffix =
    product.brand && !product.name.toLocaleLowerCase("tr").includes(product.brand.toLocaleLowerCase("tr"))
      ? ` — ${product.brand}`
      : "";
  const lead = displayVariant(product);
  const price = lead?.flash_sale?.price ?? lead?.list_price;
  return pageMetadata({
    // The code too, unless the name already says it: shoppers and shops search by it.
    title: metaTitle || `${nameWithCode(product.name, product.base_code)}${brandSuffix}`,
    absoluteTitle: !!metaTitle,
    description,
    href: productHref(product),
    images: product.image_urls?.length ? product.image_urls : [product.image_url],
    imageAlt: product.name,
    // Open Graph product tags: some chat apps print the price under the preview.
    other: {
      ...(price ? { "product:price:amount": String(price.price_incl_tax), "product:price:currency": price.currency } : {}),
      "product:availability": soldOut(product) ? "out of stock" : "in stock",
      ...(product.brand ? { "product:brand": product.brand } : {}),
    },
  });
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const [{ product, categories, category }, home] = await Promise.all([load(slug), getHomepage()]);
  if (!product) notFound();
  // Asked by id (a link from before slugs) or in other letter case: one
  // address per product. src/proxy.ts answers an id with a 301 before this
  // renders; this is the fallback when it could not reach the API.
  if (product.slug !== slug) permanentRedirect(productHref(product));

  // Internal links under the product: its category's other products, and the
  // categories (and brand) a shopper goes on to. Cached reads, the category's
  // list shared by every product page of that category.
  const [categoryList, brands] = await Promise.all([
    category ? getCategoryProducts(category.slug) : Promise.resolve([]),
    getBrands(),
  ]);
  const similar = pickSimilar(categoryList, product);
  const related = relatedCategories(product, categories, brands ?? []);

  // Ana Sayfa > Kategori > Ürün: the path a visitor takes from a menu to here.
  const crumbs: Breadcrumb[] = [
    { name: "Ana Sayfa", href: "/" },
    ...(category ? [{ name: category.name, href: `/catalog/${category.slug}` }] : []),
    { name: product.name, href: productHref(product) },
  ];

  return (
    // White, the same white the product photos are shot on.
    <main className="flex flex-1 flex-col bg-white dark:bg-background">
      <JsonLd data={productJsonLd(product, category)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ProductDetail
        initialProduct={product}
        category={category}
        categories={categories}
        breadcrumbs={crumbs}
        sidebar={<CategorySidebar items={resolveNav(home.navigation.sidebar, categories, brands ?? [])} fit />}
      />
      {(similar.length > 0 || related.length > 0) && (
        <div className={`${PAGE_CONTAINER} -mt-6 pb-10 sm:-mt-8`}>
          {category && <SimilarProducts products={similar} categories={categories} category={category} />}
          <RelatedCategories links={related} />
        </div>
      )}
      {/* "Ayrıcalıklar & Avantajlar", the homepage's cards as set in "Ana Sayfa
          Düzenleme > Avantajlar". The product's own block ends with "Birlikte
          İyi Gider", so this lands directly under it — or in its place when the
          product has none. */}
      <div className="pb-10 sm:pb-14">
        <AdvantagesSection content={home.advantages} />
      </div>
    </main>
  );
}
