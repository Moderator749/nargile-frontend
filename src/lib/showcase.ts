/**
 * "Premium Ürün Yelpazesi": the twelve tiles of the homepage showcase.
 *
 * A fixed gallery in a fixed rhythm — wide, square, square / square, square,
 * wide — repeated down four rows. The copy is the shop's own and the
 * destinations are resolved against the live catalog by the same rules the
 * menus use (`lib/storefrontNav`): a category slug where one exists, a brand
 * where one is on file, and a search for the same words until then.
 *
 * The eyebrows describe the collection rather than counting it. A tile cannot
 * say "480+ ürün" honestly without the API reporting a count, and the public
 * catalog endpoint does not — see the note in the pull request.
 */

import { navHref } from "@/lib/storefrontNav";
import type { Brand, Category, HomeShowcaseTile } from "@/types";

/** A tile as the homepage editor stores it; see `HomeShowcaseTile`. */
export type ShowcaseTile = HomeShowcaseTile;

/** The default gallery, shown until the homepage editor saves its own. */
export const SHOWCASE_TILES: ShowcaseTile[] = [
  // Row 1 — wide, square, square
  { label: "İthal Nargile Takımları", eyebrow: "İthal seçki", slug: "nargile-takimlari", wide: true, icon: "wind" },
  { label: "Nargile Marpuçları", eyebrow: "Marpuç çeşitleri", slug: "marpuclar", wide: false, icon: "wrench" },
  { label: "Nargile Kömürleri", eyebrow: "Tüketim & sarf", slug: "komurler", wide: false, icon: "flame" },
  // Row 2 — square, square, wide
  { label: "Lüle Çeşitleri", eyebrow: "Lüle seçkisi", slug: "luleler", wide: false, icon: "layers" },
  { label: "Közlükler & Folyo", eyebrow: "Köz & folyo", slug: "kozlukler", wide: false, icon: "flame" },
  { label: "Legend Hookah Koleksiyonu", eyebrow: "Marka koleksiyonu", brand: "legend", search: "legend", wide: true, icon: "sparkles" },
  // Row 3 — wide, square, square
  { label: "Çelik Nargile Takımları", eyebrow: "Çelik gövde", slug: "celik-takimlar", wide: true, icon: "shield" },
  { label: "Yedek Nargile Şişeleri", eyebrow: "Yedek parça", slug: "yedek-siseler", wide: false, icon: "package" },
  { label: "Sipsiler & Hijyen", eyebrow: "Hijyen & sarf", slug: "sipsiler", wide: false, icon: "wrench" },
  // Row 4 — square, square, wide
  { label: "Klasik Nargileler", eyebrow: "Klasik seçki", slug: "klasik-takimlar", wide: false, icon: "wind" },
  { label: "Oyun Aletleri & Tavla", eyebrow: "Oyun & keyif", slug: "oyun-aletleri", search: "oyun aleti", wide: false, icon: "gamepad" },
  { label: "Özel Tasarım Nargile Takımları", eyebrow: "Özel koleksiyon", search: "özel tasarım", wide: true, icon: "sparkles" },
];

export interface ResolvedTile extends ShowcaseTile {
  href: string;
  /** A product photo from this tile's own corner of the catalog, if it has one. */
  image: string | null;
}

/** The tiles with their links and their artwork, in grid order. */
export function resolveShowcase(
  tiles: ShowcaseTile[],
  categories: Category[],
  brands: Brand[],
  artwork: (string | null)[],
): ResolvedTile[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  return tiles.map((tile, i) => ({
    ...tile,
    href: navHref(tile, bySlug, brandBySlug),
    // A photo chosen on the tile wins, then the category's own cover photo
    // (Menü & Kategoriler), then one borrowed from its products.
    image: tile.image || (tile.slug ? bySlug.get(tile.slug)?.image_url : null) || artwork[i] || null,
  }));
}
