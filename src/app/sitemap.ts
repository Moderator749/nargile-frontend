import type { MetadataRoute } from "next";

import { BILGI_HREF } from "@/lib/bilgi";
import { ARTICLES, BLOG_HREF, articleHref } from "@/lib/blog";
import { FAQ_HREF } from "@/lib/faq";
import { DEALS_HREF } from "@/lib/flashSale";
import { INFO_LINKS } from "@/lib/footer";
import { DEFAULT_LOCALE, LOCALES, localePath, type Locale } from "@/lib/i18n/config";
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

type Entry = MetadataRoute.Sitemap[number];

/** A product's photos as absolute addresses, cover first; at most the 10 a page shows. */
function productPhotos(product: CatalogProduct): string[] {
  const photos = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
  return photos
    .slice(0, 10)
    .map((src) => (src.startsWith("/") ? `${SITE_URL}${src}` : src))
    .filter((src) => /^https?:\/\//.test(src));
}

/**
 * One page in every language it is really in: an entry per language, each
 * listing all of them (x-default the Turkish) — the sitemap form of the
 * pages' own hreflang tags (lib/seo pageMetadata), which it agrees with.
 * `languages` "all" for the shop's own pages; else an item's `locales`.
 */
function inLanguages(href: string, languages: "all" | readonly string[] | undefined, entry: Omit<Entry, "url">): Entry[] {
  const set: Locale[] = LOCALES.filter((l) => l === DEFAULT_LOCALE || languages === "all" || languages?.includes(l));
  const alternates =
    set.length > 1
      ? {
          languages: {
            ...Object.fromEntries(set.map((l) => [l, `${SITE_URL}${localePath(l, href)}`])),
            "x-default": `${SITE_URL}${href}`,
          },
        }
      : undefined;
  return set.map((l) => ({ url: `${SITE_URL}${localePath(l, href)}`, ...entry, ...(alternates ? { alternates } : {}) }));
}

const latest = (dates: (string | null | undefined)[]): Date | undefined => {
  const times = dates.map((d) => (d ? Date.parse(d) : NaN)).filter((t) => !Number.isNaN(t));
  return times.length > 0 ? new Date(Math.max(...times)) : undefined;
};

/**
 * The storefront's indexable pages, and nothing else: the homepage, the
 * catalog, the deals page, every category and every published product (with its
 * photos), the brands that have a page of their own, and the information pages.
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
    ...inLanguages("/", "all", { lastModified: newest, changeFrequency: "daily", priority: 1 }),
    ...inLanguages("/catalog", "all", { lastModified: newest, changeFrequency: "daily", priority: 0.9 }),
    // Undated: its list changes as deals open and close, which no date here records.
    ...inLanguages(DEALS_HREF, "all", { changeFrequency: "daily", priority: 0.8 }),
    ...categoryPages.flatMap((category) =>
      inLanguages(`/catalog/${category.slug}`, category.locales, {
        lastModified: latest([category.updated_at]),
        changeFrequency: "daily",
        priority: category.parent_id === null ? 0.8 : 0.7,
      }),
    ),
    ...brandPages
      .filter(({ products }) => products.length > 0)
      .flatMap(({ brand, products }) =>
        // In a language when its products are (as the page itself says).
        inLanguages(brandHref(brand.slug), LOCALES.filter((l) => products.some((p) => p.locales?.includes(l))), {
          lastModified: latest(products.map((p) => p.updated_at)),
          changeFrequency: "weekly",
          priority: 0.7,
        }),
      ),
    ...products.flatMap((p) =>
      inLanguages(productHref(p), p.locales, {
        lastModified: latest([p.updated_at]),
        changeFrequency: "weekly",
        priority: 0.6,
        // Its gallery, so the photos are found for image search as well
        // (<image:image>), the shop's own address in front of a bare path.
        ...(productPhotos(p).length > 0 ? { images: productPhotos(p) } : {}),
      }),
    ),
    // The Bilgi Sayfaları, the FAQ and the blog, in every language (each has
    // its English and Arabic, lib/content).
    ...[BILGI_HREF, ...INFO_LINKS.map((l) => l.href), FAQ_HREF, BLOG_HREF, ...ARTICLES.map(articleHref)].flatMap((href) =>
      inLanguages(href, "all", { changeFrequency: "monthly", priority: 0.4 }),
    ),
  ];
}
