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
}

/**
 * The default lists, shown until "Ana Sayfa Düzenleme" saves its own.
 *
 * The horizontal bar. "KATAGORİLER" is not here: it is the header cell above
 * the sidebar (and the drawer's handle on a phone) — see `TopNav`.
 */
export const TOP_NAV: NavEntry[] = [
  { label: "KAMPANYALAR", href: "/#firsat-urunleri", accent: true },
  { label: "NARGİLE TAKIMLARI", slug: "nargile-takimlari" },
  { label: "LÜLELER", slug: "luleler" },
  { label: "KÖZLÜKLER", slug: "kozlukler-isi-yonetimi" },
  { label: "MARPUÇLAR", slug: "marpuc-ve-hortumlar" },
  { label: "SİPSİ & AKSESUAR", slug: "sipsiler-ve-aksesuarlar" },
  { label: "KÖMÜRLER", slug: "nargile-komurleri" },
];

/** The left column: fifteen entries the shop leads with. */
export const SIDEBAR_NAV: NavEntry[] = [
  // The house brands first, then the catalog's own groups and the takım types.
  { label: "SULTAN NARGİLE", brand: "sultan", search: "sultan" },
  { label: "LEGEND HOOKAH", brand: "legend", search: "legend" },
  { label: "ODUMAN NARGİLE", brand: "oduman", search: "oduman" },
  { label: "MR.WOOD NARGİLE", brand: "mr-wood", search: "mr.wood" },
  { label: "ÇELİK TAKIMLAR", slug: "celik-takimlar" },
  { label: "KLASİK TAKIMLAR", slug: "klasik-takimlar" },
  { label: "RUS TAKIMLARI", slug: "rus-takimlari" },
  { label: "MİNİ & MASAÜSTÜ TAKIMLAR", slug: "mini-masaustu-takimlar" },
  { label: "LÜLELER", slug: "luleler" },
  { label: "KÖZLÜK & ISI YÖNETİMİ", slug: "kozlukler-isi-yonetimi" },
  { label: "MARPUÇ & HORTUMLAR", slug: "marpuc-ve-hortumlar" },
  { label: "SİPSİLER & AKSESUARLAR", slug: "sipsiler-ve-aksesuarlar" },
  { label: "NARGİLE KÖMÜRLERİ", slug: "nargile-komurleri" },
  { label: "TÜTÜN, BİTKİSEL & SARF", slug: "tutun-bitkisel-ve-sarf" },
  { label: "YEDEK ŞİŞE & GÖVDE", slug: "yedek-sise-ve-govde" },
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
    // Switched off in "Kategori Düzenle": kept in the list, not shown.
    if (entry.enabled === false) return [];
    const label =
      entry.label.trim() ||
      (entry.slug ? bySlug.get(entry.slug)?.name : undefined) ||
      (entry.brand ? brandBySlug.get(entry.brand)?.name : undefined);
    // A nameless entry whose category is gone (or switched off) has nothing to say.
    if (!label) return [];
    return [{ label: label.toLocaleUpperCase("tr-TR"), href: navHref(entry, bySlug, brandBySlug), accent: entry.accent || undefined }];
  });
}
