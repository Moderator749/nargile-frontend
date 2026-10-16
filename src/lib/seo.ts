import type { Metadata } from "next";

import { htmlToText } from "@/lib/richText";
import { DEFAULT_OG_IMAGE, INDEXING_ALLOWED, SEARCH_URL_TEMPLATE, SITE_NAME, SITE_URL } from "@/lib/site";
import { displayVariant, soldOut } from "@/lib/variants";
import type { Brand, CatalogProduct, Category, HomeFooter } from "@/types";

export interface Breadcrumb {
  name: string;
  href: string;
}

const absolute = (href: string) => `${SITE_URL}${href}`;

/**
 * The product detail page, by slug. A caller that only has the id (an old
 * cart line) still gets a working link: /product/<id> answers with a
 * permanent redirect to the slug (see src/proxy.ts).
 */
export const productHref = (product: { id: string; slug?: string | null }) =>
  `/product/${product.slug || product.id}`;

/**
 * A product photo's alt text: "<Ürün> - <Kategori> | Nargile Malzemesi". The
 * name says what is in the picture; the category and the shop are what an
 * image search ranks it under.
 */
export function productImageAlt(product: { name: string }, category?: { name: string } | null): string {
  return `${product.name}${category?.name ? ` - ${category.name}` : ""} | ${SITE_NAME}`;
}

/** A brand's landing page: every product the brand's search term finds. */
export const brandHref = (slug: string) => `/marka/${slug}`;

/**
 * Where the brand's content is canonical. Most house brands (Sultan, Legend,
 * Oduman…) also have a category of the same slug holding the same products;
 * two URLs with one product list would compete, so the category — curated by
 * hand — is the one search engines are pointed at.
 */
export function brandCanonical(slug: string, categories: { slug: string }[] | null): string {
  return categories?.some((c) => c.slug === slug) ? `/catalog/${slug}` : brandHref(slug);
}

// ── Page metadata ─────────────────────────────────────────────────────────────

export interface PageSeo {
  /** The page's own title; the layout's "%s | <shop>" template is applied unless `absoluteTitle`. */
  title: string;
  absoluteTitle?: boolean;
  description: string;
  /** Path of the canonical URL ("/catalog/luleler"): no query string, ever. */
  href: string;
  /** Photos to preview the link with, best first; the shop's own card when none. */
  images?: (string | null | undefined)[];
  imageAlt?: string;
  type?: "website" | "article";
  /** Extra <meta> tags (e.g. product:price:amount). */
  other?: Record<string, string>;
  noindex?: boolean;
}

/**
 * The full set of tags for an indexable page, in one place.
 *
 * Metadata from the layout and the page is merged shallowly: a page that sets
 * `openGraph` at all replaces the layout's whole object, `siteName` and
 * `locale` included. So every page builds the complete object here rather
 * than adding to the layout's — and the Twitter card mirrors it, so a link
 * pasted into WhatsApp, Instagram or X shows the same title, text and photo.
 */
export function pageMetadata(page: PageSeo): Metadata {
  const fullTitle = page.absoluteTitle ? page.title : `${page.title} | ${SITE_NAME}`;
  const photos = (page.images ?? []).filter((src): src is string => !!src).slice(0, 4);
  const images = photos.length > 0 ? photos.map((url) => ({ url, alt: page.imageAlt ?? page.title })) : [DEFAULT_OG_IMAGE];
  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: page.href },
    openGraph: {
      type: page.type ?? "website",
      locale: "tr_TR",
      siteName: SITE_NAME,
      title: fullTitle,
      description: page.description,
      url: page.href,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: page.description,
      images: images.map((image) => image.url),
    },
    ...(page.other ? { other: page.other } : {}),
    ...(!INDEXING_ALLOWED
      ? { robots: { index: false, follow: false } }
      : page.noindex
        ? { robots: { index: false, follow: true } }
        : {}),
  };
}

/**
 * Text typed in capitals — much of the imported catalogue — in Turkish
 * sentence case, so a search result does not shout. Mixed-case text is left
 * as written; words with digits (model codes: LA92, NA45) stay upper case.
 */
function sentenceCase(text: string): string {
  const letters = text.replace(/[^\p{L}]/gu, "");
  const upper = letters.replace(/[^\p{Lu}]/gu, "").length;
  if (letters.length < 12 || upper / letters.length < 0.7) return text;
  const lowered = text
    .split(" ")
    .map((word) => {
      // Codes and abbreviations keep their capitals: LA92, XL, HMD.
      if (/\d/.test(word) || !/[AEIİOÖUÜ]/.test(word)) return word;
      // Turkish letters make it a Turkish word (I → ı); otherwise it may be a
      // brand or a borrowed word (IGNIS, PHUNNEL), where I is i.
      return /[ÇŞĞÜÖİ]/.test(word) ? word.toLocaleLowerCase("tr") : word.toLowerCase();
    })
    .join(" ");
  return lowered.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, lead: string, letter: string) => lead + letter.toLocaleUpperCase("tr"));
}

/**
 * Text fit for a meta description: markup and whitespace gone, cut at a word
 * boundary near `max` (Google shows about 155 characters).
 */
export function metaDescription(text: string | null | undefined, max = 158): string {
  // Rich text (the editor's HTML) as its words, entities decoded.
  const clean = sentenceCase(
    htmlToText(text)
      .replace(/[#*_`>]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** The brands most of these products carry, most frequent first. */
export function leadingBrands(products: CatalogProduct[] | null | undefined, limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const p of products ?? []) if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name]) => name);
}

const SHOP_PROMISE = "Kafe, toptancı ve bayilere özel fiyatlar, ₺3.000 üzeri ücretsiz kargo.";

/** A category's description when it has no copy of its own: its name, its brands, the shop's offer. */
export function categoryDescription(category: Category, products: CatalogProduct[] | null | undefined): string {
  const brands = leadingBrands(products);
  const lead = brands.length > 0 ? `${category.name}: ${brands.join(", ")} ve daha fazlası.` : `${category.name} modelleri ve fiyatları.`;
  return metaDescription(`${lead} Orijinal ürünler, güvenli ödeme. ${SHOP_PROMISE}`);
}

export function brandDescription(brand: Brand, products: CatalogProduct[] | null | undefined): string {
  const count = products?.length ?? 0;
  const sample = (products ?? []).slice(0, 2).map((p) => p.name);
  const lead = count > 0
    ? `${brand.name} nargile ürünleri${sample.length ? `: ${sample.join(", ")}` : ""} ve tüm ${brand.name} modelleri.`
    : `${brand.name} ürünleri.`;
  return metaDescription(`${lead} Orijinal ${brand.name}, güvenli ödeme. ${SHOP_PROMISE}`);
}

// ── Site-wide structured data ─────────────────────────────────────────────────

/** The shop as an OnlineStore, with what the footer says about reaching it. */
export function organizationJsonLd(footer: HomeFooter | undefined) {
  const phone = footer?.phone?.trim();
  const email = footer?.email?.trim();
  const sameAs = (footer?.social ?? []).map((s) => s.href).filter((href) => /^https?:\/\//.test(href));
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/opengraph-image`,
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(phone || email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            areaServed: "TR",
            availableLanguage: ["Turkish"],
            ...(phone ? { telephone: phone } : {}),
            ...(email ? { email } : {}),
          },
        }
      : {}),
    ...((footer?.branches ?? []).length > 0
      ? {
          address: footer!.branches.map((b) => ({
            "@type": "PostalAddress",
            name: b.name,
            streetAddress: b.address,
            addressCountry: "TR",
          })),
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** The site, and its search box: Google may show it under the result as a sitelinks search box. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "tr-TR",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: SEARCH_URL_TEMPLATE },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Every photo of the product, cover first — what the gallery shows. */
function productImages(product: { image_url: string | null; image_urls?: string[] }): string[] {
  const gallery = product.image_urls ?? [];
  if (gallery.length > 0) return gallery;
  return product.image_url ? [product.image_url] : [];
}

export function breadcrumbJsonLd(crumbs: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absolute(c.href),
    })),
  };
}

/**
 * Product list for a catalog page. Offers always use the public RETAIL list price —
 * the same price an anonymous visitor (and crawler) sees on the page.
 */
export function productListJsonLd(
  products: CatalogProduct[],
  pageHref: string,
  categoryById: Map<number, Category>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: absolute(pageHref),
    numberOfItems: products.length,
    itemListElement: products.flatMap((product, i) => {
      // The colour the card itself shows, so the markup and the page agree.
      const variant = displayVariant(product);
      const price = variant?.list_price;
      if (!variant || !price) return [];
      const category = product.category_id != null ? categoryById.get(product.category_id) : undefined;
      return [
        {
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: product.name,
            sku: variant.sku,
            mpn: product.base_code,
            ...(productImages(product).length > 0 ? { image: productImages(product) } : {}),
            ...(product.description ? { description: htmlToText(product.description) } : {}),
            ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
            ...(category ? { category: category.name } : {}),
            url: absolute(productHref(product)),
            offers: {
              "@type": "Offer",
              price: price.price_incl_tax,
              priceCurrency: price.currency,
              url: absolute(productHref(product)),
            },
          },
        },
      ];
    }),
  };
}

/**
 * A product detail page. The offer is the public price an anonymous visitor
 * (and crawler) sees: a live flash sale's price until it ends, else RETAIL.
 *
 * A product with colours is one `Product` with one `Offer` per colour — which is
 * what they are: separately stocked things at the same price under one name. The
 * colour goes in as `name` and `color` on the offer, and its own availability,
 * so a sold-out colour is not advertised as in stock. Google penalises markup
 * that disagrees with the page, and the page says exactly this.
 */
export function productJsonLd(product: CatalogProduct, category: Category | undefined) {
  const lead = displayVariant(product);
  const sale = lead?.flash_sale;
  // Every colour carries the sheet's one price matrix, so the lead colour's
  // price is the product's; `priceValidUntil` likewise comes from its sale.
  const price = sale?.price ?? lead?.list_price;
  const availability = (inStock: boolean) =>
    inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const offer = (variant: (typeof product.variants)[number]) => ({
    "@type": "Offer",
    price: price!.price_incl_tax,
    priceCurrency: price!.currency,
    url: absolute(productHref(product)),
    sku: variant.sku,
    availability: availability(variant.in_stock !== false),
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": `${SITE_URL}/#organization` },
    ...(variant.color_name ? { name: variant.color_name, color: variant.color_name } : {}),
    ...(sale?.ends_at ? { priceValidUntil: sale.ends_at.slice(0, 10) } : {}),
  });

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: absolute(productHref(product)),
    mpn: product.base_code,
    ...(lead ? { sku: lead.sku } : {}),
    ...(productImages(product).length > 0 ? { image: productImages(product) } : {}),
    ...(product.description ? { description: htmlToText(product.description) } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(category ? { category: category.name } : {}),
    ...(product.color_names && product.color_names.length > 0 ? { color: product.color_names } : {}),
    ...(price
      ? {
          offers:
            product.variants.length > 1
              ? product.variants.map(offer)
              : {
                  // One colour (or none): a lone object, as before, rather than a
                  // list of one.
                  ...offer(product.variants[0] ?? lead!),
                  availability: availability(!soldOut(product)),
                },
        }
      : {}),
  };
}
