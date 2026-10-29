import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { ProductDetail } from "@/components/product/ProductDetail";
import { RelatedCategories } from "@/components/product/RelatedCategories";
import { SimilarProducts } from "@/components/product/SimilarProducts";
import { JsonLd } from "@/components/seo/JsonLd";
import { categoryCopy, hasCategoryCopy, parentCategory } from "@/lib/categories";
import { DEFAULT_LOCALE, localePath } from "@/lib/i18n/config";
import { RETIRED_PRODUCTS } from "@/lib/legacy/opencart";
import { getI18n } from "@/lib/i18n/server";
import { breadcrumbJsonLd, metaDescription, pageMetadata, productHref, productJsonLd, type Breadcrumb } from "@/lib/seo";
import { PAGE_CONTAINER } from "@/lib/layout";
import { pickSimilar, relatedCategories } from "@/lib/related";
import { getBrands, getCategories, getCategoryProducts, getFreeShippingFrom, getProduct } from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { advantageSources } from "@/lib/storeAdvantages";
import { nameWithCode } from "@/lib/slug";
import { resolveNav } from "@/lib/storefrontNav";
import { displayVariant, soldOut } from "@/lib/variants";

// Same freshness window as the catalog (a day; CATALOG_REVALIDATE); admin
// edits refresh it immediately.
export const revalidate = 86400;

/**
 * None is built ahead — there are hundreds, in three languages — but declaring
 * the list makes the route incrementally static: each product page is drawn
 * on its first visit and served from the cache after, as the categories are,
 * instead of being drawn for every visitor and every crawl.
 */
export async function generateStaticParams() {
  return [];
}

async function load(slug: string) {
  const [product, categories] = await Promise.all([getProduct(slug), getCategories()]);
  const category = product?.category_id != null ? categories?.find((c) => c.id === product.category_id) : undefined;
  return { product, categories: categories ?? [], category };
}

export async function generateMetadata(props: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const [{ product, category }, { locale, t }] = await Promise.all([load(slug), getI18n()]);
  if (!product) return { title: t.meta.productNotFound, robots: { index: false } };

  // "Açıklama ve SEO" wins when the admin filled it in; otherwise the page falls
  // back to the description, then to the category's standing copy.
  // A meta title the admin wrote is the whole <title>, suffix included if they
  // want one, so it bypasses the layout's "%s | <shop>" template (title.absolute).
  const metaTitle = product.meta_title?.trim();
  // The admin's own description as written; otherwise the product's text,
  // topped up with the category's standing copy when it is too short to say
  // anything (a one-line "Ürün Kodu: …" is common in the imported catalogue).
  // (In English and Arabic the name and the description are the translation,
  // and so is the category copy where the shop wrote one; without it, the
  // shared default gives way to the shop's offer.)
  const standing =
    locale === DEFAULT_LOCALE || hasCategoryCopy(category?.slug)
      ? categoryCopy(category?.slug, locale).description
      : `${t.meta.genuine} ${t.meta.shopPromise}`;
  const fallback = `${product.name}${product.brand ? `, ${product.brand}` : ""}${category ? ` · ${category.name}` : ""}. ${standing}`;
  const own = metaDescription(product.description);
  const description =
    product.meta_description?.trim() || metaDescription(own.length >= 70 ? own : `${own ? `${own} ` : ""}${fallback}`);
  // "<Ürün> — <Marka> | <Mağaza>": the brand is what people search with, so
  // it goes in the title unless the name already says it.
  const brandSuffix =
    product.brand && !product.name.toLocaleLowerCase(locale).includes(product.brand.toLocaleLowerCase(locale))
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
    locale,
    locales: product.locales,
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

export default async function ProductPage(props: PageProps<"/[locale]/[slug]">) {
  const { slug } = await props.params;
  const [{ product, categories, category }, home, { locale, t }] = await Promise.all([load(slug), getHomepage(), getI18n()]);
  if (!product) {
    // An old store's product the shop no longer sells: its model or its shelf
    // (RETIRED_PRODUCTS), the address having been its, in Turkish.
    const next = locale === DEFAULT_LOCALE ? RETIRED_PRODUCTS[slug] : undefined;
    if (next) permanentRedirect(next.replace(/^\/product\//, "/"));
    notFound();
  }
  // Asked by an old store's spelling, by id or in other letter case: one
  // address per product. src/proxy.ts answers an id and capitals with a 301
  // before this renders; this is the fallback.
  if (product.slug !== slug) permanentRedirect(localePath(locale, productHref(product)));

  // Internal links under the product: its category's other products, and the
  // categories (and brand) a shopper goes on to. Cached reads, the category's
  // list shared by every product page of that category.
  const [categoryList, brands, freeShippingFrom] = await Promise.all([
    category ? getCategoryProducts(category.slug) : Promise.resolve([]),
    getBrands(),
    getFreeShippingFrom(),
  ]);
  const similar = pickSimilar(categoryList, product);
  const related = relatedCategories(product, categories, brands ?? [], undefined, locale);

  // Ana Sayfa > (Grup >) Kategori > Ürün: the path a visitor takes from a menu to here.
  const group = parentCategory(category, categories);
  const crumbs: Breadcrumb[] = [
    { name: t.nav.crumbHome, href: "/" },
    ...(group ? [{ name: group.name, href: `/catalog/${group.slug}` }] : []),
    ...(category ? [{ name: category.name, href: `/catalog/${category.slug}` }] : []),
    { name: product.name, href: productHref(product) },
  ];

  return (
    // White, the same white the product photos are shot on.
    <main className="flex flex-1 flex-col bg-white dark:bg-background">
      <JsonLd data={productJsonLd(product, category, locale, { freeShippingFrom })} />
      <JsonLd data={breadcrumbJsonLd(crumbs, locale)} />
      <ProductDetail
        initialProduct={product}
        category={category}
        categories={categories}
        breadcrumbs={crumbs}
        sidebar={<CategorySidebar items={resolveNav(home.navigation.sidebar, categories, brands ?? [])} fit />}
        advantages={advantageSources(home)}
      />
      {(similar.length > 0 || related.length > 0) && (
        <div className={`${PAGE_CONTAINER} -mt-6 pb-10 sm:-mt-8`}>
          {category && <SimilarProducts products={similar} categories={categories} category={category} />}
          <RelatedCategories links={related} />
        </div>
      )}
    </main>
  );
}
