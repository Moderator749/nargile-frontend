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

import { Flame, Gamepad2, Layers, Package, Shield, Sparkles, Wind, Wrench, type LucideIcon } from "lucide-react";

import { navHref, type NavEntry } from "@/lib/storefrontNav";
import type { Brand, Category } from "@/types";

export interface ShowcaseTile extends NavEntry {
  /** The small red line above the title. */
  eyebrow: string;
  /** Two columns on a desktop; the rhythm of the grid. */
  wide?: boolean;
  /** Stands in for the artwork while the category has no product to show. */
  Icon: LucideIcon;
}

export const SHOWCASE_TILES: ShowcaseTile[] = [
  // Row 1 — wide, square, square
  { label: "İthal Nargile Takımları", eyebrow: "İthal seçki", slug: "nargile-takimlari", wide: true, Icon: Wind },
  { label: "Nargile Marpuçları", eyebrow: "Marpuç çeşitleri", slug: "marpuclar", Icon: Wrench },
  { label: "Nargile Kömürleri", eyebrow: "Tüketim & sarf", slug: "komurler", Icon: Flame },
  // Row 2 — square, square, wide
  { label: "Lüle Çeşitleri", eyebrow: "Lüle seçkisi", slug: "luleler", Icon: Layers },
  { label: "Közlükler & Folyo", eyebrow: "Köz & folyo", slug: "kozlukler", Icon: Flame },
  { label: "Legend Hookah Koleksiyonu", eyebrow: "Marka koleksiyonu", brand: "legend", search: "legend", wide: true, Icon: Sparkles },
  // Row 3 — wide, square, square
  { label: "Çelik Nargile Takımları", eyebrow: "Çelik gövde", slug: "celik-takimlar", wide: true, Icon: Shield },
  { label: "Yedek Nargile Şişeleri", eyebrow: "Yedek parça", slug: "yedek-siseler", Icon: Package },
  { label: "Sipsiler & Hijyen", eyebrow: "Hijyen & sarf", slug: "sipsiler", Icon: Wrench },
  // Row 4 — square, square, wide
  { label: "Klasik Nargileler", eyebrow: "Klasik seçki", slug: "klasik-takimlar", Icon: Wind },
  { label: "Oyun Aletleri & Tavla", eyebrow: "Oyun & keyif", slug: "oyun-aletleri", search: "oyun aleti", Icon: Gamepad2 },
  { label: "Özel Tasarım Nargile Takımları", eyebrow: "Özel koleksiyon", search: "özel tasarım", wide: true, Icon: Sparkles },
];

export interface ResolvedTile extends ShowcaseTile {
  href: string;
  /** A product photo from this tile's own corner of the catalog, if it has one. */
  image: string | null;
}

/** The tiles with their links and their artwork, in grid order. */
export function resolveShowcase(
  categories: Category[],
  brands: Brand[],
  artwork: (string | null)[],
): ResolvedTile[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  return SHOWCASE_TILES.map((tile, i) => ({
    ...tile,
    href: navHref(tile, bySlug, brandBySlug),
    image: artwork[i] ?? null,
  }));
}
