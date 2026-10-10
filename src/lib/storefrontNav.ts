/**
 * The storefront's navigation, as Turhan Bey's wireframe lays it out: one
 * horizontal bar under the header and one always-open category column down the
 * left. Both are fixed lists in a fixed order — what the shop wants a visitor
 * to see first, not whatever the catalog happens to contain today.
 *
 * So the labels live here, and each entry says what it *means*: a category
 * slug, a brand, or a destination of its own. `resolveNav` turns that into a
 * link against the live catalog, which keeps the lists honest two ways — an
 * entry whose category does not exist yet still lands the visitor somewhere
 * useful (a search for the same words), and the day an admin creates that
 * category or brand, the link starts pointing at it with nothing to change
 * here.
 */

import { catalogSearchHref } from "@/lib/home";
import type { Brand, Category } from "@/types";

export interface NavEntry {
  /** As the wireframe prints it. */
  label: string;
  /** The category this entry means, by slug. */
  slug?: string;
  /** The brand this entry means, by slug. */
  brand?: string;
  /** What to search for while neither is on file; the label by default. */
  search?: string;
  /** A destination that is neither: campaigns, the whole catalog. */
  href?: string;
  /** Carried in the shop's red: the one item in the bar that is an offer. */
  accent?: boolean;
}

export interface ResolvedNav {
  label: string;
  href: string;
  accent?: boolean;
}

/**
 * The horizontal bar. "KATAGORİLER" is not here: it is the header cell above
 * the sidebar (and the drawer's handle on a phone) — see `TopNav`.
 */
export const TOP_NAV: NavEntry[] = [
  { label: "KAMPANYALAR", href: "/#firsat-urunleri", accent: true },
  { label: "NARGİLE KÖMÜRLERİ", slug: "komurler" },
  { label: "LÜLELER", slug: "luleler" },
  { label: "KÖZLÜKLER", slug: "kozlukler" },
  { label: "MARPUÇLAR", slug: "marpuclar" },
  { label: "SİPSİLER", slug: "sipsiler" },
  { label: "NARGİLE MALZEMELERİ", slug: "donanim-parcalar" },
];

/** The left column, in the wireframe's order: the fifteen the shop leads with. */
export const SIDEBAR_NAV: NavEntry[] = [
  { label: "SULTAN NARGİLE", brand: "sultan", search: "sultan" },
  { label: "LEGEND HOOKAH", brand: "legend", search: "legend" },
  { label: "ODUMAN NARGİLE", brand: "oduman", search: "oduman" },
  { label: "MR.WOOD NARGİLE", brand: "mr-wood", search: "mr.wood" },
  { label: "KLASİK NARGİLE TAKIMLARI", slug: "klasik-takimlar" },
  { label: "ÇELİK NARGİLE TAKIMLARI", slug: "celik-takimlar" },
  { label: "MASAÜSTÜ NARGİLE TAKIMLARI", slug: "masaustu-takimlar" },
  { label: "RUS NARGİLE TAKIMLARI", slug: "rus-takimlar" },
  { label: "STEAMULATION", brand: "steamulation", search: "steamulation" },
  { label: "QUASAR ARGUİLE", brand: "quasar", search: "quasar" },
  { label: "MEDUSE NARGİLE TAKIMLARI", brand: "meduse", search: "meduse" },
  { label: "PANADA HOOKAH", brand: "panada", search: "panada" },
  { label: "BİTKİSEL ÜRÜNLER", slug: "bitkisel-urunler" },
  { label: "YEDEK NARGİLE ŞİŞELERİ", slug: "yedek-siseler" },
  { label: "OYUN ALETLERİ", slug: "oyun-aletleri", search: "oyun aleti" },
];

/**
 * Where one entry points, against the catalog as it stands. Exported because
 * the homepage's showcase tiles mean the same things as the menus do, and
 * should land in the same places.
 */
export function navHref(
  entry: NavEntry,
  categories: Map<string, Category>,
  brands: Map<string, Brand>,
): string {
  if (entry.href) return entry.href;
  // A category page only exists for a slug the catalog knows; linking to one it
  // does not would be a 404 with the visitor's click already spent.
  if (entry.slug && categories.has(entry.slug)) return `/catalog/${entry.slug}`;
  const brand = entry.brand ? brands.get(entry.brand) : undefined;
  if (brand) return catalogSearchHref(brand.search_term);
  return catalogSearchHref(entry.search ?? entry.label);
}

/** The entries as links, against the catalog as it stands. */
export function resolveNav(
  entries: NavEntry[],
  categories: Category[],
  brands: Brand[],
): ResolvedNav[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  return entries.map((entry) => ({
    label: entry.label,
    href: navHref(entry, bySlug, brandBySlug),
    accent: entry.accent,
  }));
}
