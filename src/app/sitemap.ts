import type { MetadataRoute } from "next";

import { BILGI_HREF } from "@/lib/bilgi";
import { ARTICLES, BLOG_HREF, articleHref } from "@/lib/blog";
import { FAQ_HREF } from "@/lib/faq";
import { DEALS_HREF } from "@/lib/flashSale";
import { INFO_LINKS } from "@/lib/footer";
import { brandCanonical, brandHref, productHref } from "@/lib/seo";
import { getBrands, getCategories, getPublicProducts } from "@/lib/server/catalog";
import { SITE_URL } from "@/lib/site";
import type { CatalogProduct } from "@/types";

export const revalidate = 3600;

/** Every public product, page by page (the API caps a page at 100). */
async function allProducts(): Promise<CatalogProduct[]> {
  const products: CatalogProduct[] = [];
  for (let skip = 0; skip < 10000; skip += 100) {
    const page = await getPublicProducts(undefined, 100, skip);
    if (!page) break;
    products.push(...page);
    if (page.length < 100) break;
  }
  return products;
}

const latest = (dates: (string | null | undefined)[]): Date | undefined => {
  const times = dates.map((d) => (d ? Date.parse(d) : NaN)).filter((t) => !Number.isNaN(t));
  return times.length > 0 ? new Date(Math.max(...times)) : undefined;
};

/**
 * The storefront's indexable pages, and nothing else: the homepage, the
 * catalog, the deals page, every category and every published product, the brands that have
 * a page of their own, and the information pages.
 *
 * `lastModified` is only given where it is known — a product's last edit, a
 * category's or brand's newest product — because a date that is always "now"
 * teaches search engines to ignore the field.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, brands, products] = await Promise.all([getCategories(), getBrands(), allProducts()]);
  const newest = latest(products.map((p) => p.updated_at));

  // Each category as its page sees it (subcategories and second categories
  // included), counted and dated by the API: an empty one says noindex, so it
  // is not listed either.
  const categoryPages = (categories ?? []).filter((c) => (c.product_count ?? 0) > 0);
  // A brand page is listed only when it is its own canonical (no category of
  // the same slug) and has something on sale.
  const brandPages = await Promise.all(
    (brands ?? [])
      .filter((b) => b.is_active && brandCanonical(b.slug, categories) === brandHref(b.slug))
      .map(async (b) => ({ brand: b, products: (await getPublicProducts(undefined, 100, 0, b.search_term)) ?? [] })),
  );

  return [
    { url: `${SITE_URL}/`, lastModified: newest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog`, lastModified: newest, changeFrequency: "daily", priority: 0.9 },
    // Undated: its list changes as deals open and close, which no date here records.
    { url: `${SITE_URL}${DEALS_HREF}`, changeFrequency: "daily", priority: 0.8 },
    ...categoryPages.map((category) => ({
      url: `${SITE_URL}/catalog/${category.slug}`,
      lastModified: latest([category.updated_at]),
      changeFrequency: "daily" as const,
      priority: category.parent_id === null ? 0.8 : 0.7,
    })),
    ...brandPages
      .filter(({ products }) => products.length > 0)
      .map(({ brand, products }) => ({
        url: `${SITE_URL}${brandHref(brand.slug)}`,
        lastModified: latest(products.map((p) => p.updated_at)),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...products.map((p) => ({
      url: `${SITE_URL}${productHref(p)}`,
      lastModified: latest([p.updated_at]),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    // The Bilgi Sayfaları, the FAQ and the blog.
    ...[BILGI_HREF, ...INFO_LINKS.map((l) => l.href), FAQ_HREF, BLOG_HREF, ...ARTICLES.map(articleHref)].map((href) => ({
      url: `${SITE_URL}${href}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
