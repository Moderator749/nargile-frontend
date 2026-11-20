import { htmlToText } from "@/lib/richText";
import { productHref, productImages } from "@/lib/seo";
import { getCategories, getPublicProducts } from "@/lib/server/catalog";
import { MEDIA_PATH, SITE_URL } from "@/lib/site";
import type { CatalogProduct, CatalogVariant } from "@/types";

/**
 * Google Merchant Center feed (RSS 2.0 + g: namespace), fetched on a schedule.
 *
 * Policy-safe by construction (2026-11-19, the user's decision): ONLY the shop's
 * games — tavla, iskambil, okey — whose primary category is one of these three.
 * Nothing hookah-related, nothing flammable (gas/lighters stay out), and no
 * product text is rewritten to pass review: titles and descriptions are the
 * site's own. A product that mentions a restricted term anyway is dropped
 * (RESTRICTED), so a later edit can't slip one in.
 *
 * Brand: the product's own; the few genuinely unbranded ones (handmade Antep
 * boards, loose pieces) carry none — not the shop's name, which says "nargile".
 * No GTINs exist, so identifier_exists is "no", which allows a missing brand.
 */
export const revalidate = 3600;

const GAME_CATEGORIES: Record<string, { googleCategory: string; weightKg: number; noun: string }> = {
  tavlalar: { googleCategory: "Toys & Games > Games > Board Games", weightKg: 3.5, noun: "tavla" },
  "iskambil-kartlari": { googleCategory: "Toys & Games > Games > Card Games", weightKg: 0.2, noun: "iskambil kağıdı" },
  "okey-takimlari": { googleCategory: "Toys & Games > Games > Tile Games", weightKg: 2.5, noun: "okey takımı" },
};

/**
 * Shipping weights as recorded on the variants (product_variants.weight_kg,
 * set 2026-11-19 — the public API does not expose them): per category, the
 * loose tavla pieces lighter than a board.
 */
const weightKg = (product: CatalogProduct, category: string) =>
  category === "tavlalar" && /^tavla pulu/i.test(product.name) ? 0.5 : GAME_CATEGORIES[category].weightKg;

const RESTRICTED =
  /nargile|hookah|shisha|sheesha|ş[iı]şe|tütün|tutun|tobacco|sigara|cigar|duman|smok|köz|kömür|komur|charcoal|marpuç|lüle|vape|puro/i;

/**
 * A photo's final address. The shop's JPEG/PNG uploads were all converted to
 * WebP of the same name and the originals removed; the old address answers
 * with a 301 (saas_backend app/core/media_files.py), and every new upload is
 * stored as WebP. Merchant Center gets the WebP itself, not the redirect.
 */
function finalImage(src: string): string {
  try {
    const url = new URL(src, SITE_URL);
    if (!url.pathname.startsWith(MEDIA_PATH)) return src;
    url.pathname = url.pathname.replace(/\.(jpe?g|png)$/i, ".webp");
    return url.toString();
  } catch {
    return src;
  }
}

const xml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

const tag = (name: string, value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "" : `<g:${name}>${xml(String(value))}</g:${name}>`;

/** Its own description where it says something, else its facts in a sentence. */
function description(product: CatalogProduct, category: string): string {
  const own = htmlToText(product.description).replace(/\s+/g, " ").trim();
  // "Eser Deluxe Tavla - Büyük. Eser marka tavla." — an unbranded one keeps its name alone.
  const brand = product.brand?.trim();
  const lead = brand ? `${product.name}. ${brand} marka ${GAME_CATEGORIES[category].noun}.` : `${product.name}.`;
  const specs = own ? ` ${own.charAt(0).toLocaleUpperCase("tr-TR")}${own.slice(1).toLocaleLowerCase("tr-TR")}.` : "";
  return `${lead}${specs}`.slice(0, 5000);
}

function item(product: CatalogProduct, variant: CatalogVariant, category: string, categoryName: string): string | null {
  const price = variant.list_price;
  if (!price) return null;
  const images = productImages(product).map(finalImage);
  if (images.length === 0) return null;
  const grouped = product.variants.length > 1;
  const title = grouped && variant.color_name ? `${product.name} - ${variant.color_name}` : product.name;
  const sale = variant.flash_sale;
  const saleEnds = sale?.ends_at ? Date.parse(sale.ends_at) : NaN;
  return [
    "<item>",
    tag("id", variant.sku),
    tag("title", title.slice(0, 150)),
    tag("description", description(product, category)),
    tag("link", `${SITE_URL}${productHref(product)}`),
    tag("image_link", images[0]),
    ...images.slice(1, 11).map((src) => tag("additional_image_link", src)),
    tag("availability", variant.in_stock === false ? "out_of_stock" : "in_stock"),
    tag("price", `${Number(price.price_incl_tax).toFixed(2)} TRY`),
    sale && Number(sale.price.price_incl_tax) < Number(price.price_incl_tax)
      ? tag("sale_price", `${Number(sale.price.price_incl_tax).toFixed(2)} TRY`) +
        (Number.isNaN(saleEnds) ? "" : tag("sale_price_effective_date", `${new Date().toISOString()}/${new Date(saleEnds).toISOString()}`))
      : "",
    tag("condition", "new"),
    tag("brand", product.brand?.trim()),
    tag("identifier_exists", "no"),
    grouped ? tag("item_group_id", product.base_code || product.id) : "",
    grouped && variant.color_name ? tag("color", variant.color_name) : "",
    tag("google_product_category", GAME_CATEGORIES[category].googleCategory),
    tag("product_type", `Oyun & Eğlence > ${categoryName}`),
    tag("shipping_weight", `${weightKg(product, category)} kg`),
    "</item>",
  ].join("");
}

export async function GET() {
  const categories = await getCategories();
  if (!categories) return new Response("Catalog unavailable", { status: 503, headers: { "Retry-After": "300" } });
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  const items: string[] = [];
  for (const slug of Object.keys(GAME_CATEGORIES)) {
    const category = bySlug.get(slug);
    if (!category) continue;
    const products = await getPublicProducts(slug, 100);
    if (!products) return new Response("Catalog unavailable", { status: 503, headers: { "Retry-After": "300" } });
    for (const product of products) {
      // Only its own (primary) games, and never one whose words touch a restricted product.
      if (product.category_id !== category.id) continue;
      if (RESTRICTED.test(`${product.name} ${htmlToText(product.description)}`)) continue;
      for (const variant of product.variants) {
        const entry = item(product, variant, slug, category.name);
        if (entry) items.push(entry);
      }
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "<channel>",
    "<title>Oyun ve Eğlence: tavla, iskambil, okey</title>",
    `<link>${xml(SITE_URL)}</link>`,
    "<description>Tavla, iskambil kağıdı ve okey takımları.</description>",
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
