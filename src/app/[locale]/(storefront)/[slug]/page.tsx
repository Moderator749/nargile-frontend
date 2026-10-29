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
import { breadcrumbJsonLd, metaDescription, pageMetadata, productHref, productJsonLd, type Breadcrumb, categoryHref } from "@/lib/seo";
import { PAGE_CONTAINER } from "@/lib/layout";
import { pickSimilar, relatedCategories } from "@/lib/related";
import {
  getBrands,
  getCategories,
  getCategoryBySlug,
  getCategoryProducts,
  getFreeShippingFrom,
  getProduct,
  required,
} from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { advantageSources } from "@/lib/storeAdvantages";
import { nameWithCode } from "@/lib/slug";
import { resolveNav } from "@/lib/storefrontNav";
import { displayVariant, soldOut } from "@/lib/variants";

import { BrandPage, brandMetadata } from "./brand";
import { CategoryPage, categoryMetadata } from "./category";

// Same freshness window as the catalog (a day; CATALOG_REVALIDATE); admin
// edits refresh it immediately.
export const revalidate = 86400;

/*
 * /<slug> at the root: a category's page, a brand's or a product's. The three
 * share the one namespace — the backend gives none of them another's slug
 * (app/services/root_slugs.py) — and the shop's own pages (/cart, /blog…) are
 * folders of their own, which Next serves first (lib/rootRoutes). A slug is a
 * category's when the category list (cached, the same read every page makes)
 * has it, else a brand's when the brand list has it exactly, else it is
 * looked up as a product.
 */

/**
 * The categories are built ahead; products are not — there are hundreds, in
 * three languages — but declaring the list makes the route incrementally
 * static: each product page is drawn on its first visit and served from the
 * cache after, instead of being drawn for every visitor and every crawl.
 */
export async function generateStaticParams() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  const slugs = new Set([...(categories ?? []).map((c) => c.slug), ...(brands ?? []).filter((b) => b.is_active).map((b) => b.slug)]);
  return [...slugs].map((slug) => ({ slug }));
}

/**
 * The category or brand this slug names, if any; throws when the API is down,
 * so an outage is never a 404. A brand by its exact slug only: a slug that
 * begins with a brand's name is more often a product's.
 */
async function findShelf(slug: string) {
  const [categories, brands] = await Promise.all([required(await getCategories(), "/categories"), getBrands()]);
  const shelf = categories.find((c) => c.slug === slug) ?? null;
  const brand = shelf ? null : ((brands ?? []).find((b) => b.is_active && b.slug === slug) ?? null);
  return { categories, brands: brands ?? [], shelf, brand };
}

async function load(slug: string) {
  const [product, categories] = await Promise.all([getProduct(slug), getCategories()]);
  const category = product?.category_id != null ? categories?.find((c) => c.id === product.category_id) : undefined;
  return { product, categories: categories ?? [], category };
}

export async function generateMetadata(props: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const [{ shelf, brand }, i18n] = await Promise.all([findShelf(slug), getI18n()]);
  if (shelf) return categoryMetadata(shelf, i18n);
  if (brand) return brandMetadata(brand, i18n);
  const { locale, t } = i18n;
  const { product, category } = await load(slug);
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

export default async function RootSlugPage(props: PageProps<"/[locale]/[slug]">) {
  const { slug } = await props.params;
  const [{ categories: shelves, brands, shelf, brand }, i18n] = await Promise.all([findShelf(slug), getI18n()]);
  if (shelf) return <CategoryPage category={shelf} categories={shelves} {...i18n} />;
  if (brand) return <BrandPage brand={brand} brands={brands} categories={shelves} {...i18n} />;
  return ProductPage(slug, i18n);
}

async function ProductPage(slug: string, { locale, t }: Awaited<ReturnType<typeof getI18n>>) {
  const [{ product, categories, category }, home] = await Promise.all([load(slug), getHomepage()]);
  if (!product) {
    // A category's slug the admin has since changed leads on to its current
    // address.
    const renamed = await getCategoryBySlug(slug);
    if (renamed && renamed.slug !== slug) permanentRedirect(localePath(locale, categoryHref(renamed.slug)));
    // An old store's product the shop no longer sells: its model or its shelf
    // (RETIRED_PRODUCTS), the address having been its, in Turkish.
    const next = locale === DEFAULT_LOCALE ? RETIRED_PRODUCTS[slug] : undefined;
    if (next) permanentRedirect(next.replace(/^\/(?:product|catalog)\//, "/"));
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
    ...(group ? [{ name: group.name, href: categoryHref(group.slug) }] : []),
    ...(category ? [{ name: category.name, href: categoryHref(category.slug) }] : []),
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
