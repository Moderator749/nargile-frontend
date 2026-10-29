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

import { DEALS_HREF } from "@/lib/flashSale";
import { catalogSearchHref } from "@/lib/home";
import type { Locale } from "@/lib/i18n/config";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { brandHref, categoryHref } from "@/lib/seo";
import type { Brand, Category, HomeNavItem } from "@/types";

/**
 * One entry, as the homepage editor stores it: a label, and what it means —
 * a category slug, a brand, or a destination of its own (`href`). With none
 * of them it searches the catalog for its label (or `search`). `accent`
 * carries it in the shop's red.
 */
export type NavEntry = HomeNavItem;

export interface ResolvedNav {
  /** As the admin wrote it (or the category's name); `navLabel` sets it in capitals for the menus. */
  label: string;
  href: string;
  accent?: boolean;
}

/**
 * The default lists, shown until "Ana Sayfa Düzenleme" saves its own.
 *
 * The horizontal bar. "KATEGORİLER" is not here: it is the header cell above
 * the sidebar (and the drawer's handle on a phone) — see `TopNav`.
 */
export const TOP_NAV: NavEntry[] = [
  // Every live deal, on a page of its own.
  { label: "FIRSAT ÜRÜNLERİ", href: DEALS_HREF, accent: true },
  { label: "NARGİLE TAKIMLARI", slug: "nargile-takimlari" },
  { label: "LÜLELER", slug: "luleler" },
  { label: "MARPUÇLAR", slug: "marpuclar" },
  { label: "AKSESUARLAR", slug: "aksesuarlar" },
  { label: "SARF MALZEMELERİ", slug: "sarf-malzemeleri" },
  { label: "KÖMÜRLER", slug: "nargile-komurleri" },
];

/**
 * The left column: Turhan Bey's list, in his order — the house brands and the
 * takım types first, then the catalog's own corners. A flat list, no sub-menus.
 */
export const SIDEBAR_NAV: NavEntry[] = [
  { label: "SULTAN NARGİLE", brand: "sultan", search: "sultan" },
  { label: "LEGEND HOOKAH", brand: "legend", search: "legend" },
  { label: "ODUMAN NARGİLE", brand: "oduman", search: "oduman" },
  { label: "MR.WOOD NARGİLE", brand: "mr-wood", search: "mr.wood" },
  { label: "KLASİK NARGİLE TAKIMLARI", search: "klasik nargile" },
  { label: "ÇELİK NARGİLE TAKIMLARI", search: "çelik nargile takımı" },
  { label: "MASAÜSTÜ NARGİLE TAKIMLARI", slug: "masaustu-nargile-takimlari" },
  { label: "RUS NARGİLE TAKIMLARI", search: "rus nargile" },
  { label: "STEAMULATION", brand: "steamulation", search: "steamulation" },
  { label: "QUASAR ARGUİLE", brand: "quasar", search: "quasar" },
  { label: "MEDUSE NARGİLE TAKIMLARI", brand: "meduse", search: "meduse" },
  { label: "PANADA HOOKAH", brand: "panada", search: "panada" },
  { label: "BİTKİSEL ÜRÜNLER", slug: "bitkisel-urunler" },
  { label: "YEDEK NARGİLE ŞİŞELERİ", slug: "nargile-siseleri" },
  { label: "OYUN ALETLERİ", search: "oyun aleti" },
  { label: "NARGİLE KÖMÜRLERİ", slug: "nargile-komurleri" },
  { label: "LÜLELER", slug: "luleler" },
  { label: "KÖZLÜKLER", slug: "kozlukler" },
  { label: "MARPUÇLAR", slug: "marpuclar" },
  { label: "SİPSİLER", slug: "sipsiler" },
  { label: "NARGİLE MALZEMELERİ", slug: "aksesuarlar" },
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
  if (entry.slug && categories.has(entry.slug)) return categoryHref(entry.slug);
  // A brand's former category ("Sultan Nargile" under Nargile Takımları): the
  // brand's page has the same address.
  if (entry.slug && brands.has(entry.slug)) return brandHref(entry.slug);
  const brand = entry.brand ? brands.get(entry.brand) : undefined;
  // The brand's own page: the same products its search finds, at a URL that
  // can be indexed and shared.
  if (brand) return brandHref(brand.slug);
  return catalogSearchHref(entry.search ?? entry.label);
}

/**
 * A menu label in capitals, by the rules of the page's language: Turkish turns
 * "i" into "İ", which in an English label would read "ACCESSORİES". So the
 * menus capitalise as they render (TopNav, CategoryList), where the language
 * is known, rather than resolveNav, which every page calls without one.
 */
export const navLabel = (label: string, locale: Locale) => label.toLocaleUpperCase(INTL_LOCALE[locale]);

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
      (entry.slug ? (bySlug.get(entry.slug)?.name ?? brandBySlug.get(entry.slug)?.name) : undefined) ||
      (entry.brand ? brandBySlug.get(entry.brand)?.name : undefined);
    // A nameless entry whose category is gone (or switched off) has nothing to say.
    if (!label) return [];
    return [{ label, href: navHref(entry, bySlug, brandBySlug), accent: entry.accent || undefined }];
  });
}
