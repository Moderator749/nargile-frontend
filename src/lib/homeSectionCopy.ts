/**
 * The words, pictures and links of the homepage's sections that once lived in
 * their components — the perks bar, "Sizin İçin Seçtiklerimiz", the lüle row,
 * the SultanPuan and Kumbara bands, the photo showcases, "Sektörde Referans
 * Noktası", "Markalarımız", the Közlükler and Oyun rows — now part of the
 * "Ana Sayfa Düzenleme" document, each section editable in its drawer.
 *
 * The defaults are the copy the storefront always had, taken from the
 * homepage's messages, so nothing on the page changes until the admin edits
 * it. Their English and Arabic come from the same messages, as a built-in
 * part of the translation memory (lib/homeTranslations): a default reads in
 * every language as before, a rewritten text goes through "Çeviriler" like
 * every other homepage text.
 *
 * A figure that is live from "Parametreler" stays live: the text holds a
 * placeholder the storefront fills in — {tutar}, {oran}, {bant} (`fillIn`).
 */

import type { HomeTranslations, TextMemory } from "@/lib/homeTranslations";
import { homeMessages } from "@/lib/i18n/messages/home";
import type { Homepage } from "@/types";

export type SectionCopy = Pick<
  Homepage,
  | "perks"
  | "picks"
  | "lules"
  | "sultanpuan"
  | "kumbara"
  | "bento"
  | "bento2"
  | "bento3"
  | "statement"
  | "brand_showcase"
  | "kozlukler"
  | "games"
>;

/** The placeholders a text may hold, and what each stands for. */
export const PLACEHOLDERS = { tutar: "{tutar}", oran: "{oran}", bant: "{bant}" } as const;

type Words = (typeof homeMessages)["tr"];

/**
 * "Görsel Vitrin"'s starting photos (the shop's own, in public/images), where
 * each leads and its focal point in the 3:2 box; their words are the
 * messages' `bento.boxes`, in this order.
 */
const BENTO_BOXES: [string, string, number][] = [
  ["/images/avantaj-cat-komur.jpg", "/komurler", 42],
  ["/images/avantaj-cat-tutun.jpg", "/bitkisel-urunler", 55],
  ["/images/avantaj-cat-aksesuar.jpg", "/malzemeler", 50],
];

/** "Görsel Vitrin 2"'s, as the first's: the messages' `bento2.boxes`. */
const BENTO2_BOXES: [string, string, number][] = [
  ["/images/avantaj-cat-nargile.jpg", "/klasik-takimlar", 50],
  ["/images/avantaj-legend.jpg", "/legend", 68],
  ["/images/avantaj-oduman.jpg", "/oduman", 28],
];

/** "Görsel Vitrin 3"'s, under the deals where the campaign boxes were: the messages' `bento3.boxes`. */
const BENTO3_BOXES: [string, string, number][] = [
  ["/images/hero-3.jpg", "/firsat-urunleri", 52],
  ["/images/avantaj-hero-3.jpg", "/kozlukler", 62],
  ["/images/avantaj-hero-1.jpg", "/malzemeler", 22],
];

/** A photo box with its words stacked at the bottom, on a 55% wash: where a box starts. */
const bentoBoxes = (boxes: [string, string, number][], words: Words["bento"]["boxes"]) =>
  boxes.map(([image, href, focus_x], i) => ({
    image,
    href,
    focus_x,
    focus_y: 50,
    ...words[i],
    layout: null,
    font_sizes: null,
    text_colors: null,
    overlay: true,
    overlay_strength: 55,
  }));

type Emphasis = { before: string; strong: string; after: string };
const joined = (e: Emphasis) => `${e.before}${e.strong}${e.after}`;

/** The sections' copy in one language of the messages, with the placeholders where the live figures go. */
function copyIn(w: Words): SectionCopy {
  return {
    perks: {
      installments: {
        icon: "credit-card",
        label: w.perks.installmentsLabel,
        value: w.perks.installmentsValue,
        note: w.perks.installmentsNote,
      },
      volume: { icon: "shopping-cart", label: w.perks.volumeLabel, note: w.perks.volumeNote },
      transfer: { icon: "trending-down", label: w.perks.transferLabel, note: w.perks.transferNote },
    },
    picks: {
      title: w.picks.title,
      subtitle: w.picks.subtitle,
      bestsellers: w.picks.bestsellers,
      newest: w.picks.newest,
      shipping_eyebrow: w.perks.shippingEyebrow,
      shipping_text: joined(w.perks.shippingText(PLACEHOLDERS.tutar)),
    },
    lules: {
      title: w.lules.title,
      kinds: [...w.lules.kinds],
      closing: w.lules.closing,
      more: w.lules.more,
      href: "/luleler",
      courier_eyebrow: w.perks.courierEyebrow,
      courier_text: w.perks.courierText,
    },
    sultanpuan: {
      subtitle: w.loyalty.sultanPuanBand(PLACEHOLDERS.bant),
      note: w.loyalty.sultanPuanNote,
      call: w.loyalty.sultanPuanCall,
    },
    kumbara: {
      subtitle: w.loyalty.kumbaraSubtitle,
      note: w.loyalty.kumbaraNote(PLACEHOLDERS.tutar, PLACEHOLDERS.oran),
      call: w.loyalty.kumbaraCall,
    },
    bento: { boxes: bentoBoxes(BENTO_BOXES, w.bento.boxes) },
    bento2: { boxes: bentoBoxes(BENTO2_BOXES, w.bento2.boxes) },
    bento3: { boxes: bentoBoxes(BENTO3_BOXES, w.bento3.boxes) },
    statement: { heading: w.statement.heading, lead: w.statement.lead, rest: w.statement.rest },
    brand_showcase: {
      heading: w.brands.heading,
      collection: w.brands.collection,
      sultan: { description: w.brands.sultan, logo: null },
      oduman: { description: w.brands.oduman, logo: null },
      legend: { description: w.brands.legend, logo: null },
    },
    kozlukler: { title: w.rows.kozlukTitle, subtitle: w.rows.kozlukSubtitle, more: w.rows.kozlukMore },
    games: { title: w.rows.gamesTitle, subtitle: w.rows.gamesSubtitle, more: w.rows.gamesMore },
  };
}

export const DEFAULT_SECTION_COPY: SectionCopy = copyIn(homeMessages.tr);

/** Every text of the Turkish copy beside the same text in `other`, walking both together. */
function pairUp(tr: unknown, other: unknown, into: TextMemory): TextMemory {
  if (typeof tr === "string" && typeof other === "string") {
    if (tr.trim() && tr !== other) into[tr.trim()] = other;
  } else if (Array.isArray(tr) && Array.isArray(other)) {
    tr.forEach((item, i) => pairUp(item, other[i], into));
  } else if (tr && other && typeof tr === "object" && typeof other === "object") {
    for (const key of Object.keys(tr)) pairUp((tr as Record<string, unknown>)[key], (other as Record<string, unknown>)[key], into);
  }
  return into;
}

/**
 * The default copy's English and Arabic, as translation memory entries
 * (Turkish → translation). Laid under the stored memory: an entry the admin
 * saves in "Çeviriler" wins.
 */
export const BUILT_IN_HOME_MEMORY: Pick<HomeTranslations, "en" | "ar"> = {
  en: pairUp(DEFAULT_SECTION_COPY, copyIn(homeMessages.en as unknown as Words), {}),
  ar: pairUp(DEFAULT_SECTION_COPY, copyIn(homeMessages.ar as unknown as Words), {}),
};

/** "Toplam {tutar} barajına…" with the figures in: each placeholder swapped for its value. */
export function fillIn(text: string, values: Partial<Record<keyof typeof PLACEHOLDERS, string>>): string {
  return text.replace(/\{(tutar|oran|bant)\}/g, (whole, name: keyof typeof PLACEHOLDERS) => values[name] ?? whole);
}

/**
 * A text split around one placeholder, for showing the figure in bold:
 * "{tutar} ve üzeri…" → { before: "", after: " ve üzeri…" }. Without the
 * placeholder, the whole text is `before` and `found` is false.
 */
export function around(text: string, name: keyof typeof PLACEHOLDERS): { before: string; after: string; found: boolean } {
  const at = text.indexOf(PLACEHOLDERS[name]);
  if (at < 0) return { before: text, after: "", found: false };
  return { before: text.slice(0, at), after: text.slice(at + PLACEHOLDERS[name].length), found: true };
}
