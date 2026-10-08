import type { CartLineItem, CatalogPrice, CatalogProduct, CatalogVariant } from "@/types";

/**
 * The cart snapshot for adding `quantity` of a product: display prices only (the
 * server re-prices everything at checkout) plus the photo for the cart thumbnail.
 */
export function cartLineFor(
  product: CatalogProduct,
  variant: CatalogVariant,
  price: CatalogPrice,
  opts: { quantity: number; isLoggedIn: boolean; saleLive: boolean },
): CartLineItem {
  return {
    variant_id: variant.id,
    quantity: opts.quantity,
    product_name: product.name,
    // The colour chosen, so the cart row can say which one without a lookup.
    color_name: variant.color_name ?? null,
    image_url: product.image_url,
    price: (variant.list_price ?? price).price_incl_tax,
    segment_price: opts.isLoggedIn || opts.saleLive ? price.price_incl_tax : null,
  };
}
