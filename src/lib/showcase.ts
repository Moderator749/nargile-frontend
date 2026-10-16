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
  { label: "Nargile Takımları", eyebrow: "Tüm takımlar", slug: "nargile-takimlari", wide: true, icon: "wind" },
  { label: "Marpuçlar", eyebrow: "Silikon & deri", slug: "marpuclar", wide: false, icon: "wrench" },
  { label: "Nargile Kömürleri", eyebrow: "Hindistan cevizi", slug: "nargile-komurleri", wide: false, icon: "flame" },
  // Row 2 — square, square, wide
  { label: "Lüle Çeşitleri", eyebrow: "Phunnel & killer", slug: "luleler", wide: false, icon: "layers" },
  { label: "Isı Yönetim Araçları", eyebrow: "Közlükler", slug: "isi-yonetim-araclari", wide: false, icon: "flame" },
  { label: "Legend Hookah Koleksiyonu", eyebrow: "Marka koleksiyonu", brand: "legend", search: "legend", wide: true, icon: "sparkles" },
  // Row 3 — wide, square, square
  { label: "Çantalı Nargile Takımları", eyebrow: "Taşınabilir", slug: "cantali-nargile-takimlari", wide: true, icon: "shield" },
  { label: "Yedek Parça", eyebrow: "Şişe, conta & difüzör", slug: "yedek-parca", wide: false, icon: "package" },
  { label: "Aksesuarlar", eyebrow: "Baca, maşa & çanta", slug: "aksesuarlar", wide: false, icon: "wrench" },
  // Row 4 — square, square, wide
  { label: "Yakıcılar", eyebrow: "Ocak, pürmüz & gaz", slug: "yakicilar", wide: false, icon: "wind" },
  { label: "Masaüstü Takımlar", eyebrow: "Kompakt takımlar", slug: "masaustu-nargile-takimlari", wide: false, icon: "package" },
  { label: "Sarf Malzemeleri", eyebrow: "Günlük tüketim", slug: "sarf-malzemeleri", wide: true, icon: "sparkles" },
];

export interface ResolvedTile extends ShowcaseTile {
  href: string;
  /** A product photo from this tile's own corner of the catalog, if it has one. */
  image: string | null;
}

/** The tiles with their links and their artwork, in grid order. */
/**
 * The category a tile shows, for its picture: the one it names, or the one its
 * link opens (/catalog/<slug>) — so a tile edited to a plain link keeps its
 * category's photo.
 */
export function tileSlug(tile: Pick<ShowcaseTile, "slug" | "href">): string | null {
  if (tile.slug) return tile.slug;
  const match = tile.href?.match(/^\/catalog\/([a-z0-9-]+)\/?$/);
  return match ? match[1] : null;
}

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
    image: tile.image || bySlug.get(tileSlug(tile) ?? "")?.image_url || artwork[i] || null,
  }));
}
