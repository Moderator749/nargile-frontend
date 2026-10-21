/**
 * A colour's name, as the admin typed it in Turkish ("Siyah", "Gold gövde-
 * Beyaz şişe"), in the page's language — for display only: the stored name
 * stays the variant's key (selection, stock, the cart line).
 *
 * The admin's names are a small vocabulary: colours, and "<colour> gövde" /
 * "<colour> şişe" (body and base) joined by a hyphen. English reads them in
 * order ("Gold body - White base"); Arabic puts the noun first and makes the
 * colour agree with it ("جسم ذهبي - قاعدة بيضاء"). A word it does not know
 * is shown as written.
 *
 * No path aliases here: `npm test` imports this file as it is.
 */

import type { Locale } from "./config.ts";

/** Colour words: English, and Arabic masculine / feminine. */
const COLOURS: Record<string, [string, string, string]> = {
  siyah: ["Black", "أسود", "سوداء"],
  beyaz: ["White", "أبيض", "بيضاء"],
  kırmızı: ["Red", "أحمر", "حمراء"],
  sarı: ["Yellow", "أصفر", "صفراء"],
  yeşil: ["Green", "أخضر", "خضراء"],
  mavi: ["Blue", "أزرق", "زرقاء"],
  lacivert: ["Navy", "كحلي", "كحلية"],
  mor: ["Purple", "بنفسجي", "بنفسجية"],
  pembe: ["Pink", "وردي", "وردية"],
  turuncu: ["Orange", "برتقالي", "برتقالية"],
  gri: ["Grey", "رمادي", "رمادية"],
  füme: ["Smoke", "دخاني", "دخانية"],
  bordo: ["Burgundy", "عنابي", "عنابية"],
  kahverengi: ["Brown", "بني", "بنية"],
  gold: ["Gold", "ذهبي", "ذهبية"],
  altın: ["Gold", "ذهبي", "ذهبية"],
  silver: ["Silver", "فضي", "فضية"],
  gümüş: ["Silver", "فضي", "فضية"],
  bronz: ["Bronze", "برونزي", "برونزية"],
  bakır: ["Copper", "نحاسي", "نحاسية"],
  şeffaf: ["Clear", "شفاف", "شفافة"],
  amber: ["Amber", "كهرماني", "كهرمانية"],
  mat: ["Matte", "مطفي", "مطفية"],
  çelik: ["Steel", "ستيل", "ستيل"],
};

/** The parts a name may say it is about: English, Arabic, and whether the Arabic noun is feminine. */
const PARTS: Record<string, [string, string, boolean]> = {
  gövde: ["body", "جسم", false],
  şişe: ["base", "قاعدة", true],
};

/** Names that are a design's name, not a colour. */
const NAMES: Record<string, [string, string]> = {
  "ateş çemberi": ["Ring of Fire", "حلقة النار"],
};

const lower = (s: string) => s.toLocaleLowerCase("tr");

function segment(text: string, locale: "en" | "ar"): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const last = words.length > 1 ? PARTS[lower(words[words.length - 1])] : undefined;
  const colours = last ? words.slice(0, -1) : words;
  const feminine = last?.[2] ?? false;
  const said = colours.map((w) => {
    const c = COLOURS[lower(w)];
    if (!c) return w;
    return locale === "en" ? c[0] : feminine ? c[2] : c[1];
  });
  if (!last) return said.join(" ");
  return locale === "en" ? `${said.join(" ")} ${last[0]}` : `${last[1]} ${said.join(" ")}`;
}

export function colorLabel(name: string, locale: Locale): string {
  if (locale === "tr" || !name) return name;
  const named = NAMES[lower(name.trim())];
  if (named) return locale === "en" ? named[0] : named[1];
  // Hyphens part the name, and so does each "gövde" / "şişe" ("Çelik gövde siyah şişe").
  const segments = name.split(/\s*-\s*/).flatMap((part) => {
    const out: string[][] = [[]];
    for (const word of part.trim().split(/\s+/).filter(Boolean)) {
      out[out.length - 1].push(word);
      if (PARTS[lower(word)]) out.push([]);
    }
    return out.filter((words) => words.length > 0).map((words) => words.join(" "));
  });
  const out = segments.map((part) => segment(part, locale)).join(" - ");
  // Typed in capitals ("SİYAH"): the English stays in capitals.
  return locale === "en" && name === name.toLocaleUpperCase("tr") && /\p{L}/u.test(name) ? out.toUpperCase() : out;
}
