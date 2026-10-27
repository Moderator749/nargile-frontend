/**
 * "Premium Ürün Yelpazesi": the tiles of the homepage showcase.
 *
 * Laid out on a desktop as rows of four slots, two rows at most (`placeShowcase`):
 * a tile takes one slot, or two when the editor marks it "geniş" — one such
 * tile to a row. The copy is the shop's own and the destinations are resolved
 * against the live catalog by the same rules the menus use (`lib/storefrontNav`):
 * a category slug where one exists, a brand where one is on file, and a search
 * for the same words until then.
 *
 * The eyebrows describe the collection rather than counting it. A tile cannot
 * say "480+ ürün" honestly without the API reporting a count, and the public
 * catalog endpoint does not — see the note in the pull request.
 */

import { foldSearch } from "@/lib/searchFold";
import { navHref } from "@/lib/storefrontNav";
import type { Brand, Category, HomeShowcaseTile } from "@/types";

export * from "@/lib/showcaseGrid";

/** A tile as the homepage editor stores it; see `HomeShowcaseTile`. */
export type ShowcaseTile = HomeShowcaseTile;

/** The default gallery, shown until the homepage editor saves its own: two full rows. */
export const SHOWCASE_TILES: ShowcaseTile[] = [
  // Row 1 — wide, square, square
  { label: "Nargile Takımları", eyebrow: "Tüm takımlar", slug: "nargile-takimlari", wide: true, icon: "wind" },
  { label: "Marpuçlar", eyebrow: "Silikon & deri", slug: "marpuclar", wide: false, icon: "wrench" },
  { label: "Nargile Kömürleri", eyebrow: "Hindistan cevizi", slug: "nargile-komurleri", wide: false, icon: "flame" },
  // Row 2 — square, square, wide
  { label: "Lüle Çeşitleri", eyebrow: "Phunnel & killer", slug: "luleler", wide: false, icon: "layers" },
  { label: "Isı Yönetim Araçları", eyebrow: "Közlükler", slug: "isi-yonetim-araclari", wide: false, icon: "flame" },
  { label: "Legend Hookah Koleksiyonu", eyebrow: "Marka koleksiyonu", brand: "legend", search: "legend", wide: true, icon: "sparkles" },
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

/**
 * The title the editor gives a tile it has just added ("Kutu ekle"): one still
 * wearing it was never filled in. Shared with the photo boxes (Görsel Vitrin).
 */
export const BLANK_BOX_TITLE = "Yeni kutu";

/** A box the editor added and never filled in: no title, or still its "Yeni kutu". */
export function isPlaceholderTitle(title: string | null | undefined): boolean {
  const t = foldSearch((title ?? "").trim());
  return !t || t === foldSearch(BLANK_BOX_TITLE);
}

export function resolveShowcase(
  tiles: ShowcaseTile[],
  categories: Category[],
  brands: Brand[],
  artwork: (string | null)[],
): ResolvedTile[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  return (
    tiles
      .map((tile, i) => ({
        ...tile,
        href: navHref(tile, bySlug, brandBySlug),
        // A photo chosen on the tile wins, then the category's own cover photo
        // (Menü & Kategoriler), then one borrowed from its products.
        image: tile.image || bySlug.get(tileSlug(tile) ?? "")?.image_url || artwork[i] || null,
      }))
      // A tile switched off, or added and never filled in, is not the shop's to show.
      .filter((tile) => tile.enabled !== false && !isPlaceholderTitle(tile.label))
  );
}
