import { SITE_URL } from "@/lib/site";
import type { CatalogProduct, Category } from "@/types";

export interface Breadcrumb {
  name: string;
  href: string;
}

const absolute = (href: string) => `${SITE_URL}${href}`;

/** The product detail page. */
export const productHref = (id: string) => `/product/${id}`;

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
      const variant = product.variants[0];
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
            ...(product.image_url ? { image: product.image_url } : {}),
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
 */
export function productJsonLd(product: CatalogProduct, category: Category | undefined) {
  const variant = product.variants[0];
  const sale = variant?.flash_sale;
  const price = sale?.price ?? variant?.list_price;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: absolute(productHref(product.id)),
    mpn: product.base_code,
    ...(variant ? { sku: variant.sku } : {}),
    ...(product.image_url ? { image: product.image_url } : {}),
    ...(product.description ? { description: product.description } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(category ? { category: category.name } : {}),
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            price: price.price_incl_tax,
            priceCurrency: price.currency,
            url: absolute(productHref(product.id)),
            availability:
              variant?.in_stock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            ...(sale ? { priceValidUntil: sale.ends_at.slice(0, 10) } : {}),
          },
        }
      : {}),
  };
}
