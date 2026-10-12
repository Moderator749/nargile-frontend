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
import type { Brand, Category, HomeNavItem } from "@/types";

/**
 * One entry, as the homepage editor stores it: a label, and what it means —
 * a category slug, a brand, or a destination of its own (`href`). With none
 * of them it searches the catalog for its label (or `search`). `accent`
 * carries it in the shop's red.
 */
export type NavEntry = HomeNavItem;

export interface ResolvedNav {
  label: string;
  href: string;
  accent?: boolean;
  /** 1 for a subcategory listed under its parent (the automatic sidebar). */
  depth?: number;
}

/**
 * The default lists, shown until "Ana Sayfa Düzenleme" saves its own.
 *
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

/**
 * The entries as links, against the catalog as it stands. An entry that names
 * a category or brand but leaves its label blank takes that one's current
 * name, so renaming the category renames the menu too.
 */
export function resolveNav(
  entries: NavEntry[],
  categories: Category[],
  brands: Brand[],
): ResolvedNav[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  return entries.flatMap((entry) => {
    const label =
      entry.label.trim() ||
      (entry.slug ? bySlug.get(entry.slug)?.name : undefined) ||
      (entry.brand ? brandBySlug.get(entry.brand)?.name : undefined);
    // A nameless entry whose category is gone (or switched off) has nothing to say.
    if (!label) return [];
    return [{ label: label.toLocaleUpperCase("tr-TR"), href: navHref(entry, bySlug, brandBySlug), accent: entry.accent || undefined }];
  });
}

/**
 * The automatic sidebar: every active category in the catalog's own order,
 * each top-level one followed by its subcategories. A category added in
 * "Menü & Kategoriler" appears here with nothing else to edit.
 */
export function autoSidebar(categories: Category[]): ResolvedNav[] {
  const order = (a: Category, b: Category) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "tr");
  const tops = categories.filter((c) => c.parent_id === null).sort(order);
  return tops.flatMap((top) => [
    { label: top.name.toLocaleUpperCase("tr-TR"), href: `/catalog/${top.slug}` },
    ...categories
      .filter((c) => c.parent_id === top.id)
      .sort(order)
      .map((c) => ({ label: c.name.toLocaleUpperCase("tr-TR"), href: `/catalog/${c.slug}`, depth: 1 })),
  ]);
}

/** The left column as configured: automatic, or the admin's own list. */
export function sidebarNav(
  navigation: { sidebar_mode: "auto" | "custom"; sidebar: NavEntry[] },
  categories: Category[],
  brands: Brand[],
): ResolvedNav[] {
  return navigation.sidebar_mode === "auto" ? autoSidebar(categories) : resolveNav(navigation.sidebar, categories, brands);
}
