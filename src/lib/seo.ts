import { SITE_URL } from "@/lib/site";
import { displayVariant, soldOut } from "@/lib/variants";
import type { CatalogProduct, Category } from "@/types";

export interface Breadcrumb {
  name: string;
  href: string;
}

const absolute = (href: string) => `${SITE_URL}${href}`;

/** The product detail page. */
export const productHref = (id: string) => `/product/${id}`;

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
            ...(product.description ? { description: product.description } : {}),
            ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
            ...(category ? { category: category.name } : {}),
            url: absolute(productHref(product.id)),
            offers: {
              "@type": "Offer",
              price: price.price_incl_tax,
              priceCurrency: price.currency,
              url: absolute(productHref(product.id)),
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
    url: absolute(productHref(product.id)),
    sku: variant.sku,
    availability: availability(variant.in_stock !== false),
    ...(variant.color_name ? { name: variant.color_name, color: variant.color_name } : {}),
    ...(sale?.ends_at ? { priceValidUntil: sale.ends_at.slice(0, 10) } : {}),
  });

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: absolute(productHref(product.id)),
    mpn: product.base_code,
    ...(lead ? { sku: lead.sku } : {}),
    ...(productImages(product).length > 0 ? { image: productImages(product) } : {}),
    ...(product.description ? { description: product.description } : {}),
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
