import type { Metadata } from "next";

import { DEFAULT_LOCALE, LOCALES, OG_LOCALE, localePath, type Locale } from "@/lib/i18n/config";
import { colorLabel } from "@/lib/i18n/colors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { htmlToText } from "@/lib/richText";
import { DEFAULT_OG_IMAGE, INDEXING_ALLOWED, SITE_NAME, SITE_URL, canonicalMedia } from "@/lib/site";
import { publishedStores, storeHref } from "@/lib/stores";
import { displayVariant, soldOut } from "@/lib/variants";
import type { Brand, CatalogProduct, Category, HomeFooter } from "@/types";

export interface Breadcrumb {
  name: string;
  href: string;
}

/** A site path as a full URL, in a language: ("/catalog", "en") → "https://…/en/catalog". */
const absolute = (href: string, locale: Locale = DEFAULT_LOCALE) => `${SITE_URL}${localePath(locale, href)}`;

/** schema.org's `inLanguage` for each language (BCP 47). */
const IN_LANGUAGE: Record<Locale, string> = { tr: "tr-TR", en: "en", ar: "ar" };

/**
 * The product detail page, by slug, at the root: /<slug>, as the old store
 * addressed its products. A caller that only has the id (an old cart line)
 * still gets a working link: /product/<id> answers with a permanent redirect
 * to the slug (see src/proxy.ts).
 */
export const productHref = (product: { id: string; slug?: string | null }) =>
  product.slug ? `/${product.slug}` : `/product/${product.id}`;

/**
 * A product photo's alt text: "<Ürün> - <Kategori> | Nargile Malzemesi". The
 * name says what is in the picture; the category and the shop are what an
 * image search ranks it under.
 */
export function productImageAlt(product: { name: string }, category?: { name: string } | null): string {
  return `${product.name}${category?.name ? ` - ${category.name}` : ""} | ${SITE_NAME}`;
}

/** A brand's landing page: every product the brand's search term finds. */
/**
 * Brands whose page is folded into their category for good: the category is
 * the one page search engines are given (next.config.ts 301s the brand's
 * address there), so every link goes straight to it. Sultan Nargile's brand
 * slug ("sultan-nargile", once "sultan") is not its category's ("sultan").
 */
export const BRAND_CATEGORY: Record<string, string> = { "sultan-nargile": "sultan", sultan: "sultan" };

/** Where a link to the brand goes: its category where it was folded into one, else its own page. */
export const brandHref = (slug: string) => (BRAND_CATEGORY[slug] ? `/catalog/${BRAND_CATEGORY[slug]}` : brandPageHref(slug));

/** The brand page's own address (/marka/<slug>). */
export const brandPageHref = (slug: string) => `/marka/${slug}`;

/**
 * Where the brand's content is canonical. Most house brands (Sultan, Legend,
 * Oduman…) also have a category of the same slug holding the same products;
 * two URLs with one product list would compete, so the category — curated by
 * hand — is the one search engines are pointed at.
 */
export function brandCanonical(slug: string, categories: { slug: string }[] | null): string {
  const category = BRAND_CATEGORY[slug] ?? slug;
  return categories?.some((c) => c.slug === category) ? `/catalog/${category}` : brandPageHref(slug);
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
  /** The language this copy of the page is in; Turkish when not given. */
  locale?: Locale;
  /**
   * The languages the page has real content in, Turkish always among them:
   * the hreflang set. "all" for a page whose words are the shop's own
   * (the homepage, the catalog); a product or category passes its
   * `locales` from the API. Not given: Turkish only.
   */
  locales?: "all" | readonly string[];
}

/** The languages a page is really in, Turkish first. */
function pageLanguages(locales: PageSeo["locales"]): Locale[] {
  if (locales === "all") return [...LOCALES];
  return LOCALES.filter((l) => l === DEFAULT_LOCALE || locales?.includes(l));
}

/**
 * The full set of tags for an indexable page, in one place.
 *
 * Languages: each copy of a page is its own canonical (/catalog/x,
 * /en/catalog/x, /ar/catalog/x), and every copy lists the others as hreflang
 * alternates, Turkish as x-default — but only the languages the page has
 * real content in. An English or Arabic copy of a page that has no
 * translation (a product not yet translated, the Turkish-only info pages)
 * would be the Turkish text under another address: it is left out of the
 * set and kept out of the index (noindex, follow), so it never competes
 * with the Turkish page or reads as thin duplicate content.
 *
 * Metadata from the layout and the page is merged shallowly: a page that sets
 * `openGraph` at all replaces the layout's whole object, `siteName` and
 * `locale` included. So every page builds the complete object here rather
 * than adding to the layout's — and the Twitter card mirrors it, so a link
 * pasted into WhatsApp, Instagram or X shows the same title, text and photo.
 */
/** About as much of a title as a search result shows. */
const TITLE_MAX = 60;

export function pageMetadata(page: PageSeo): Metadata {
  const locale = page.locale ?? DEFAULT_LOCALE;
  const languages = pageLanguages(page.locales);
  const translated = languages.includes(locale);
  const href = localePath(locale, page.href);
  // The shop's name after the page's, unless that pushes the title past what
  // a search result shows (about 60 characters): then the page's own words
  // alone, which are what the search was for.
  const suffixed = `${page.title} | ${SITE_NAME}`;
  const bare = page.absoluteTitle || (suffixed.length > TITLE_MAX && page.title.length <= TITLE_MAX);
  const fullTitle = bare ? page.title : suffixed;
  const photos = (page.images ?? []).filter((src): src is string => !!src).slice(0, 4);
  // The shop's own card is drawn per language (app/[locale]/opengraph-image).
  const card = { ...DEFAULT_OG_IMAGE, url: localePath(locale, DEFAULT_OG_IMAGE.url) };
  const images = photos.length > 0 ? photos.map((url) => ({ url, alt: page.imageAlt ?? page.title })) : [card];
  return {
    title: bare ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: {
      canonical: href,
      ...(translated && languages.length > 1
        ? {
            languages: {
              ...Object.fromEntries(languages.map((l) => [l, localePath(l, page.href)])),
              "x-default": page.href,
            },
          }
        : {}),
    },
    openGraph: {
      type: page.type ?? "website",
      locale: OG_LOCALE[locale],
      ...(translated && languages.length > 1
        ? { alternateLocale: languages.filter((l) => l !== locale).map((l) => OG_LOCALE[l]) }
        : {}),
      siteName: SITE_NAME,
      title: fullTitle,
      description: page.description,
      url: href,
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
      : page.noindex || !translated
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

/**
 * An introduction's opening paragraph, where it says enough on its own: the
 * category copy is written so that its first paragraph is the search result's
 * snippet, which would otherwise end on the first words of the second.
 */
export function leadParagraph(html: string): string {
  const first = /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(html)?.[1];
  return first && htmlToText(first).trim().length >= 80 ? first : html;
}

/** The brands most of these products carry, most frequent first. */
export function leadingBrands(products: CatalogProduct[] | null | undefined, limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const p of products ?? []) if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name]) => name);
}

/** A category's description when it has no copy of its own: its name, its brands, the shop's offer. */
export function categoryDescription(
  category: Category,
  products: CatalogProduct[] | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const { meta } = getDictionary(locale);
  return metaDescription(`${meta.categoryLead(category.name, leadingBrands(products))} ${meta.genuine} ${meta.shopPromise}`);
}

export function brandDescription(brand: Brand, products: CatalogProduct[] | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  const { meta } = getDictionary(locale);
  const sample = (products ?? []).slice(0, 2).map((p) => p.name);
  const lead = meta.brandLead(brand.name, sample, products?.length ?? 0);
  return metaDescription(`${lead} ${meta.brandGenuine(brand.name)} ${meta.shopPromise}`);
}

// ── The shop's terms, as search engines read them ─────────────────────────────

/**
 * The returns the "Mesafeli Satış Sözleşmesi" (section 6) grants: 14 days from
 * delivery, by mail, the carriage paid by the shop when the parcel goes back
 * with its contracted carrier. Stated on the organization and on every offer,
 * which is where Google's merchant listings read it ("Ücretsiz iade · 14 gün"
 * under a result). The sözleşme's hygiene exceptions (an opened lüle, a
 * marpuç) are the law's own and stay on that page.
 */
export function returnPolicyJsonLd(locale: Locale = DEFAULT_LOCALE) {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "TR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
    // The path, not lib/bilgi: that module carries every document's text, and
    // this one is in the product cards' bundle.
    merchantReturnLink: absolute("/bilgi/mesafeli-satis-sozlesmesi", locale),
  };
}

/**
 * How long a parcel takes: "Kargo ve Teslimat Şartları" gives it to the
 * carrier within 2 business days, and the carrier brings it anywhere in
 * Turkey in 1–3 more.
 */
const DELIVERY_TIME = {
  "@type": "ShippingDeliveryTime",
  handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "DAY" },
  transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
};

/**
 * Delivery in Turkey, on every offer. Free (a rate of 0) only where that is
 * certain for the product on its own: a retail cart ships on the shop from
 * `freeFrom` (the panel's "ücretsiz kargo limiti"), so one unit at or above it
 * does — unless it counts as coal, whose carts the "%50 Kuralı" can still send
 * karşı ödemeli. Otherwise the buyer pays the carrier on delivery at the
 * carrier's own rate, which no fixed figure here could honestly state: the
 * destination and the delivery time are given, and no shippingRate at all.
 */
function shippingJsonLd(price: number, coal: boolean, freeFrom: number | null) {
  const free = freeFrom !== null && !coal && price >= freeFrom;
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
    ...(free ? { shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "TRY" } } : {}),
    deliveryTime: DELIVERY_TIME,
  };
}

// ── Site-wide structured data ─────────────────────────────────────────────────

/** The shop as an OnlineStore, with what the footer says about reaching it. */
export function organizationJsonLd(footer: HomeFooter | undefined, locale: Locale = DEFAULT_LOCALE) {
  const phone = footer?.phone?.trim();
  const email = footer?.email?.trim();
  const sameAs = (footer?.social ?? []).map((s) => s.href).filter((href) => /^https?:\/\//.test(href));
  return {
    "@context": "https://schema.org",
    // An online shop that also sells wholesale, to cafés and dealers.
    "@type": ["OnlineStore", "WholesaleStore"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: absolute("/", locale),
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
            availableLanguage: ["Turkish", "English", "Arabic"],
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
    // Its stores, each described on its own page (lib/stores storeJsonLd).
    ...(publishedStores().length > 0
      ? { department: publishedStores().map((s) => ({ "@id": `${SITE_URL}${storeHref(s)}#store` })) }
      : {}),
    hasMerchantReturnPolicy: returnPolicyJsonLd(locale),
  };
}

/**
 * The site, and its search box: Google may show it under the result as a
 * sitelinks search box. Each language's homepage describes its own copy of
 * the site, searched in its own language.
 */
export function websiteJsonLd(locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absolute("/", locale)}#website`,
    name: SITE_NAME,
    url: absolute("/", locale),
    inLanguage: IN_LANGUAGE[locale],
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absolute("/catalog", locale)}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Every photo of the product, cover first — what the gallery shows — on the shop's own domain. */
function productImages(product: { image_url: string | null; image_urls?: string[] }): string[] {
  const gallery = product.image_urls ?? [];
  return (gallery.length > 0 ? gallery : product.image_url ? [product.image_url] : []).map(canonicalMedia);
}

/** Breadcrumbs by their site paths (unprefixed), put in the page's language. */
export function breadcrumbJsonLd(crumbs: Breadcrumb[], locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absolute(c.href, locale),
    })),
  };
}

/**
 * The products a listing page shows (a category, the deals, the homepage), as
 * Google's "summary page": each item only the address of the product's own
 * page, in the order shown. The full Product — price, stock, returns,
 * shipping — is stated once, on that page (productJsonLd). A Product per card
 * here would be read as a merchant listing of its own, short of what the
 * product page says, and reported as an error on every listing it is in.
 */
export function productListJsonLd(products: CatalogProduct[], pageHref: string, locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: absolute(pageHref, locale),
    numberOfItems: products.length,
    itemListElement: products.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absolute(productHref(product), locale),
    })),
  };
}

/** What the product page's markup needs to know about the shop's terms. */
export interface ProductTerms {
  /** The retail free-shipping limit in TRY; null when it is not known. */
  freeShippingFrom: number | null;
}

/**
 * A product detail page. The offer is the public price an anonymous visitor
 * (and crawler) sees: a live flash sale's price until it ends, else RETAIL —
 * never a Bayi / Toptan / Kafe price, which only a signed-in firm sees. The
 * stock is the shop's one stock, the same for everyone, so a colour's
 * availability is the page's.
 *
 * One colour (or none): a `Product` with its `Offer`. Several: a
 * `ProductGroup` varying by colour, each colour a `Product` with its own SKU,
 * colour and offer — Google's form for variants, which lets a result show the
 * colours and a sold-out colour be told apart. Every variant is on this one
 * page (the picker chooses between them), so they share its address. Google
 * penalises markup that disagrees with the page, and the page says exactly this.
 */
export function productJsonLd(
  product: CatalogProduct,
  category: Category | undefined,
  locale: Locale = DEFAULT_LOCALE,
  terms: ProductTerms = { freeShippingFrom: null },
) {
  const lead = displayVariant(product);
  const sale = lead?.flash_sale;
  // Every colour carries the sheet's one price matrix, so the lead colour's
  // price is the product's; `priceValidUntil` likewise comes from its sale.
  const price = sale?.price ?? lead?.list_price;
  const url = absolute(productHref(product), locale);
  const images = productImages(product);
  const availability = (inStock: boolean) =>
    inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const shipping = price
    ? shippingJsonLd(Number(price.price_incl_tax), product.is_cart_rule_applied ?? true, terms.freeShippingFrom)
    : undefined;
  const returns = returnPolicyJsonLd(locale);

  const offer = (inStock: boolean, variant?: (typeof product.variants)[number]) => ({
    "@type": "Offer",
    price: price!.price_incl_tax,
    priceCurrency: price!.currency,
    url,
    ...(variant ? { sku: variant.sku } : {}),
    availability: availability(inStock),
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": `${SITE_URL}/#organization` },
    ...(sale?.ends_at ? { priceValidUntil: sale.ends_at.slice(0, 10) } : {}),
    ...(shipping ? { shippingDetails: shipping } : {}),
    hasMerchantReturnPolicy: returns,
  });

  const common = {
    "@context": "https://schema.org",
    name: product.name,
    url,
    ...(images.length > 0 ? { image: images } : {}),
    ...(product.description ? { description: htmlToText(product.description) } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(category ? { category: category.name } : {}),
  };

  if (product.variants.length > 1) {
    return {
      ...common,
      "@type": "ProductGroup",
      productGroupID: product.base_code,
      variesBy: ["https://schema.org/color"],
      hasVariant: product.variants.map((variant) => {
        const colour = variant.color_name ? colorLabel(variant.color_name, locale) : null;
        return {
          "@type": "Product",
          name: colour ? `${product.name} - ${colour}` : product.name,
          sku: variant.sku,
          mpn: variant.sku,
          url,
          ...(images.length > 0 ? { image: images } : {}),
          ...(colour ? { color: colour } : {}),
          ...(price ? { offers: offer(variant.in_stock !== false, variant) } : {}),
        };
      }),
    };
  }

  // One colour (or none): a lone Product and offer, as before.
  return {
    ...common,
    "@type": "Product",
    mpn: product.base_code,
    ...(lead ? { sku: lead.sku } : {}),
    ...(product.color_names && product.color_names.length > 0 ? { color: product.color_names.map((c) => colorLabel(c, locale)) } : {}),
    ...(price ? { offers: offer(!soldOut(product), product.variants[0] ?? lead ?? undefined) } : {}),
  };
}
