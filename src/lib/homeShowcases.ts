/**
 * What the "Közlükler" and "Oyun & Eğlence" bands show, picked on the server
 * from their categories, so the page carries the few products it draws and
 * not the whole category.
 *
 * Picked at the public RETAIL price (the only one the server knows); the bands
 * re-price for a signed-in visitor (useOwnPrices).
 */

import type { CatalogProduct } from "@/types";
import { cardPrice } from "@/lib/catalogFilters";

export const KOZLUK_CATEGORY_SLUG = "kozlukler";
export const GAMES_CATEGORY_SLUG = "oyun-eglence";

/** From this price a közlük is a heat-management device, not a quick accessory. */
export const PREMIUM_KOZLUK_MIN = 700;

const priceOf = (p: CatalogProduct) => cardPrice(p, null) ?? 0;

/** One per name: the catalog carries the same item in several sizes or colours. */
function distinct(products: CatalogProduct[]): CatalogProduct[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    const key = p.name.trim().toLocaleLowerCase("tr");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * `count` of them, in their order, but one per family first (its name's first
 * word: "Maxx", "Legend", "Kaloud"), so three colours of one model never fill
 * a band; the rest of the room then goes to whatever comes next.
 */
function varied(products: CatalogProduct[], count: number): CatalogProduct[] {
  const family = (p: CatalogProduct) => p.name.trim().split(/\s+/)[0].toLocaleLowerCase("tr");
  const seen = new Set<string>();
  const first = products.filter((p) => !seen.has(family(p)) && seen.add(family(p)));
  const rest = products.filter((p) => !first.includes(p));
  return [...first, ...rest].slice(0, count);
}

const showable = (products: CatalogProduct[] | null) =>
  distinct((products ?? []).filter((p) => p.image_url && p.variants.length > 0 && priceOf(p) > 0));

export interface KozlukTab {
  key: "premium" | "practical";
  label: string;
  /** The first is the tab's featured (largest) tile. */
  products: CatalogProduct[];
}

export interface KozlukShowcaseData {
  total: number;
  tabs: KozlukTab[];
}

/**
 * The devices and the everyday accessories (screens, caps, aluminium bowls),
 * dearest first so each tab opens on its showpiece, five each and from as many
 * families as there are: a featured tile and four beside it. A tab with
 * nothing in it is left out; with neither, there is no band.
 */
export function kozlukShowcase(products: CatalogProduct[] | null): KozlukShowcaseData | null {
  const all = showable(products);
  const premium = all.filter((p) => priceOf(p) >= PREMIUM_KOZLUK_MIN).sort((a, b) => priceOf(b) - priceOf(a));
  const practical = all.filter((p) => priceOf(p) < PREMIUM_KOZLUK_MIN).sort((a, b) => priceOf(b) - priceOf(a));
  const tabs: KozlukTab[] = [
    { key: "premium" as const, label: "Isı Yöneticileri", products: varied(premium, 5) },
    { key: "practical" as const, label: "Pratik Aparatlar", products: varied(practical, 5) },
  ].filter((t) => t.products.length > 0);
  return tabs.length > 0 ? { total: (products ?? []).length, tabs } : null;
}

/**
 * The games, as the shop sorts them: each a search inside the category. Matched
 * on the name lowercased the Turkish way — `/iskambil/i` misses "İskambil",
 * whose dotted capital is not an "I". `accessories` are the words of what is
 * sold for a game but is not one (loose tavla pieces, dice, an okey rack):
 * the card counts, shows and prices the boards and sets only, so "en uygun"
 * is the cheapest set, not ₺220 of pieces. Its search still finds them.
 */
const GAMES = [
  { key: "tavla", label: "Tavla", match: "tavla", accessories: ["pulu", "pul ", "zarı", "zar "], suit: "♠", tagline: "Sedef, ceviz, masif" },
  { key: "okey", label: "Okey", match: "okey", accessories: ["ıstaka", "yedek"], suit: "♥", tagline: "Ahşap, çantalı, klasik" },
  { key: "iskambil", label: "İskambil", match: "iskambil", accessories: [], suit: "♣", tagline: "Plastik, çift deste" },
] as const;

export interface GameGroup {
  key: (typeof GAMES)[number]["key"];
  label: string;
  suit: string;
  tagline: string;
  /** Boards and sets, accessories left out. */
  count: number;
  /** Its card's photograph: the group's showpiece. */
  cover: CatalogProduct;
  /** The cheapest, for "en uygun …". */
  cheapest: CatalogProduct;
}

export interface GamesShowcaseData {
  total: number;
  games: GameGroup[];
  /** "Masanın Yıldızları": the dearest sets across the games, one per name. */
  stars: CatalogProduct[];
}

export function gamesShowcase(products: CatalogProduct[] | null): GamesShowcaseData | null {
  const all = showable(products);
  const games = GAMES.flatMap(({ key, label, match, accessories, suit, tagline }) => {
    const named = (p: CatalogProduct) => `${p.name.toLocaleLowerCase("tr")} `;
    const group = all.filter((p) => named(p).includes(match)).sort((a, b) => priceOf(b) - priceOf(a));
    const sets = group.filter((p) => !accessories.some((word) => named(p).includes(word)));
    // Only accessories in it: they are what the game has, so they stand in.
    const shown = sets.length > 0 ? sets : group;
    return shown.length > 0
      ? [{ key, label, suit, tagline, count: shown.length, cover: shown[0], cheapest: shown[shown.length - 1] }]
      : [];
  });
  if (games.length === 0) return null;
  const covers = new Set(games.map((g) => g.cover.id));
  const stars = varied([...all].sort((a, b) => priceOf(b) - priceOf(a)).filter((p) => !covers.has(p.id)), 4);
  return { total: (products ?? []).length, games, stars };
}
