/**
 * A product page's <title> and meta description on its Turkish page when the
 * admin left "SEO Başlığı" / "SEO Açıklaması" blank — 915 of 917 products —
 * or the description is boilerplate copied onto many (the API's
 * `meta_description_shared`).
 *
 * Written for the search result: the product as people search it (its name,
 * what kind of thing it is when the name does not say, its brand), the shop's
 * promise (original goods; free shipping where checkout gives it), within what
 * Google shows (about 60 and 158 characters). A shouted name ("FALCON MILANO
 * 250 GR") is set in title case; a model code stays only when it is a clean
 * one ("LL105", "RTK 60-03"), never a jumble that repeats the name
 * ("NA53-1 KLASIK").
 *
 * Pure: the page passes what it knows (the lead as plain text, the shelf, the
 * shipping it can promise), so this is testable on its own.
 */

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 158;

/** What a product is, by the shelf it sits under (the root category), when its name does not already say it. */
const TYPES: Record<string, { label: string; said: RegExp }> = {
  "nargile-takimlari": { label: "Nargile Takımı", said: /tak[ıi]m/i },
  luleler: { label: "Nargile Lülesi", said: /l[üu]le|bowl|hazne/i },
  marpuclar: { label: "Nargile Marpucu", said: /marpu[çc]|hortum/i },
  siseler: { label: "Nargile Şişesi", said: /[şs]i[şs]e/i },
  komurler: { label: "Nargile Kömürü", said: /k[öo]m[üu]r/i },
  kozlukler: { label: "Közlük (HMD)", said: /k[öo]zl[üu]k|hmd/i },
  "bitkisel-urunler": { label: "Bitkisel Nargile Aroması", said: /aroma|bitkisel|mela[sş]/i },
};

export function productType(rootSlug: string | null | undefined, name: string): string | null {
  const type = rootSlug ? TYPES[rootSlug] : undefined;
  return type && !type.said.test(name) ? type.label : null;
}

const UNITS: Record<string, string> = { GR: "gr", KG: "kg", ML: "ml", MM: "mm", CM: "cm", ADET: "adet" };
/** Abbreviations that stay in capitals in a shouted name. */
const KEEP_CAPS = /^(?:XL|XXL|LED|HMD|NFX|MRA|DMK|USB|DIY)$/;

/** A name in capitals ("COSMIC TURKISH MASTIC 200 GR") in title case; any other name as written. */
export function tidyName(name: string): string {
  const plain = name.replace(/\s+/g, " ").trim();
  const letters = plain.replace(/[^\p{L}]/gu, "");
  if (letters.length < 4 || letters !== letters.toLocaleUpperCase("tr")) return plain;
  return plain
    .split(" ")
    .map((word) => {
      if (UNITS[word]) return UNITS[word];
      if (/\d/.test(word) || KEEP_CAPS.test(word) || !/[AEIİOÖUÜ]/.test(word)) return word;
      // Turkish letters make it a Turkish word (I → ı); otherwise a brand or borrowed word, where I is i.
      const lower = /[ÇŞĞÜÖİ]/.test(word) ? word.toLocaleLowerCase("tr") : word.toLowerCase();
      return lower.charAt(0).toLocaleUpperCase("tr") + lower.slice(1);
    })
    .join(" ");
}

/**
 * A brand as a name: all lower case ("alpha hookah") or all capitals
 * ("PANADA HOOKAH", "ADYA COCO'S") in title case; mixed ("Mr.Wood") as written.
 */
export function tidyBrand(brand: string | null | undefined): string | null {
  const b = brand?.replace(/\s+/g, " ").trim();
  if (!b) return null;
  if (b !== b.toLocaleLowerCase("tr") && b !== b.toLocaleUpperCase("tr")) return b;
  // Brands are foreign names: "I" is "i", never the Turkish dotless "ı".
  return b
    .toLowerCase()
    .replace(/(^|[\s-])(\p{Ll})/gu, (_, lead: string, letter: string) => lead + letter.toLocaleUpperCase("tr"));
}

/** For comparing: lower case with the dotted and dotless i as one, letters and digits only ("SAMSARIS" = "Samsaris"). */
const squash = (text: string) =>
  text.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/[^\p{L}\p{N}]/gu, "");
/** A model code a buyer could search by: a short prefix and a number ("LL105", "RTK 60-03", "LH031-V1"). */
const CLEAN_CODE = /^[A-ZÇĞİÖŞÜ]{1,5}[ -]?\d{1,4}(?:[-. ]?[A-Z0-9]{1,4})?$/i;

export function cleanCode(code: string | null | undefined, name: string): string | null {
  const c = code?.trim();
  if (!c || !CLEAN_CODE.test(c) || squash(name).includes(squash(c))) return null;
  return c;
}

/**
 * "<Ad> <tür> (<kod>) — <Marka>", the parts dropped in that order of least
 * use — the code, then the brand, then the type — until it fits.
 */
export function productTitle({
  name,
  code,
  brand,
  type,
}: {
  name: string;
  code: string | null;
  brand: string | null;
  type: string | null;
}): string {
  const n = tidyName(name);
  const b = tidyBrand(brand);
  const brandPart = b && !squash(n).includes(squash(b)) ? ` — ${b}` : "";
  const typePart = type ? ` ${type}` : "";
  const codePart = code ? ` (${code})` : "";
  const tries = [
    n + typePart + codePart + brandPart,
    n + typePart + brandPart,
    n + typePart + codePart,
    n + typePart,
    n + brandPart,
  ];
  return tries.find((t) => t.length <= TITLE_MAX) ?? n;
}

/** The trade's words in product names: lower case in a sentence, whatever the name does. */
const GENERIC = new Set(
  "nargile nargilesi takim takimi takimlari seti set marpuc marpucu lule lulesi luleler sise sisesi komur komuru kozluk kozlugu ahsap cam cami celik dokum pirinc kutu adet gr kg ml model modeli replika orijinal".split(" "),
);

/** Not whitespace, and not in the shop's copy: a block's end until the text is split on it. */
const BREAK = "¶";
const shouted = (word: string) => {
  const letters = word.replace(/[^\p{L}]/gu, "");
  return letters.length >= 2 && letters === letters.toLocaleUpperCase("tr") && letters !== letters.toLocaleLowerCase("tr");
};

/**
 * Runs of three or more words in capitals ("NARGİLE TAKIMINIZIN EN ASİL
 * PARÇASI") in lower case, the Turkish way (I → ı); the product's own name
 * and brand words keep their name's casing ("Naimi Woodking"), codes and
 * abbreviations their capitals. A sentence then starts with a capital.
 */
function calm(text: string, keep: Map<string, string>): string {
  const words = text.split(" ");
  const out = [...words];
  let run: number[] = [];
  const flush = () => {
    if (run.length >= 3) {
      for (const i of run) {
        const w = words[i];
        if (/\d/.test(w) || KEEP_CAPS.test(w.replace(/[^\p{L}]/gu, ""))) continue;
        // The letters only: the punctuation stuck to the word stays.
        out[i] = w.replace(/[\p{L}\p{N}'’.-]*[\p{L}\p{N}]/u, (core) => keep.get(squash(core)) ?? core.toLocaleLowerCase("tr"));
      }
    }
    run = [];
  };
  words.forEach((w, i) => {
    if (shouted(w)) run.push(i);
    else if (!/^[\d\p{P}\p{S}]*$/u.test(w)) flush();
  });
  flush();
  return out.join(" ").replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, lead: string, letter: string) => lead + letter.toLocaleUpperCase("tr"));
}

/** A heading, paragraph or list item's end marked in the editor's HTML, so it survives as a sentence break once the tags are gone. */
export function blockBreaks(html: string | null | undefined): string {
  return (html ?? "").replace(/<\/(?:h[1-6]|li|p)>|<br\s*\/?>/gi, (tag) => `${BREAK}${tag}`);
}

/**
 * The description as one plain line to quote from (`text`: the plain text of
 * `blockBreaks(html)`): a heading or list item ends a sentence rather than
 * running into the next paragraph; quotes and "Ürün kodu: …" are dropped;
 * shouting is calmed.
 */
export function leadText(text: string, name: string, brand: string | null): string {
  const keep = new Map<string, string>();
  for (const w of `${tidyName(name)} ${tidyBrand(brand) ?? ""}`.split(/\s+/)) {
    // Brand and model words, not the trade's own (written in lower case mid-sentence).
    if (w && !/[çşğüöıİ]/i.test(w) && !GENERIC.has(squash(w))) keep.set(squash(w), w);
  }
  const plain = text
    .replace(/["“”‘’]|''/g, "")
    .replace(/(?<!\p{L})(?:ürün kodu|stok kodu|model kodu)\s*:\s*\S+/giu, "")
    .replace(/[#*_`>]+/g, " ")
    // "ahududu,BÖĞÜRTLEN": a word after a comma is a word of its own.
    .replace(/,(?=\p{L})/gu, ", ")
    // Each break: a full stop where the block did not end on one.
    .split(BREAK)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((block) => (/[.!?…]$/.test(block) ? block : `${block.replace(/[\s,;:–—-]+$/, "")}.`))
    .join(" ");
  return calm(plain, keep);
}

/** `text` in at most `budget` characters: whole sentences where they fit, else cut at a word. */
function fit(text: string, budget: number): string {
  const ended = /[.!?…]$/.test(text) ? text : `${text}.`;
  if (ended.length <= budget) return ended;
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > budget) break;
    out += sentence;
  }
  // Whole sentences, unless they leave most of the room empty: then cut at a word.
  if (out.trim().length >= budget * 0.6) return out.trim();
  const cut = text.slice(0, budget - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > budget * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:–—-]+$/, "")}…`;
}

export type ShippingPromise = "free" | "threshold" | "none";

/** Turkish letters to their ASCII bases, lower case: for matching words however they were typed. */
const fold = (text: string) =>
  text
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" })[c] ?? c);

/** A replica ("Quasar Raas 2 (Replika)"): never promised as an original. */
export const isReplica = (name: string) => /replika|muadil|imitasyon/i.test(name);

/** A heading made only of the product's own words and the trade's ("Caos Lüle Seti.", "Quasar Raas 2 Nargile Lülesi."). */
function onlyNames(sentence: string, naming: Set<string>): boolean {
  const words = fold(sentence).split(/[^a-z0-9]+/).filter(Boolean);
  return words.length > 0 && words.length <= 8 && words.every((w) => naming.has(w) || GENERIC.has(w));
}

/**
 * "<what it is, from its own text>. Orijinal <marka> ürün güvencesi, <kargo>."
 * A replica says so instead ("Replika model, <kargo>.").
 * The shipping line is checkout's: free on this product alone (`free`), free
 * from the threshold (`threshold`, any non-coal product), or only fast
 * shipping for coal, whose carts the %50 rule can send karşı ödemeli.
 */
export function productDescription({
  lead,
  name,
  brand,
  type,
  shipping,
  threshold,
}: {
  /** The product's own text, plain (`leadText` of its description). */
  lead: string;
  name: string;
  brand: string | null;
  type: string | null;
  shipping: ShippingPromise;
  /** The free-shipping threshold as written ("3.000 TL"). */
  threshold: string;
}): string {
  const b = tidyBrand(brand);
  const promise =
    shipping === "free" ? "ücretsiz kargo" : shipping === "threshold" ? `${threshold} üzeri ücretsiz kargo` : "hızlı kargo";
  const tail = isReplica(name) ? `Replika model, ${promise}.` : `Orijinal ${b ? `${b} ` : ""}ürün güvencesi, ${promise}.`;
  // Leading sentences that only name the product (headings: "Copper Balance
  // Klasik.", "Panada Hookah. Bobby Robot Nargile Takımı.") say nothing the title does not.
  const sentences = lead.trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
  const naming = new Set(fold(`${brand ?? ""} ${name}`).split(/[^a-z0-9]+/).filter(Boolean));
  let first = 0;
  while (first < sentences.length - 1 && onlyNames(sentences[first] ?? "", naming)) first++;
  const own = sentences.slice(first).join("").trim();
  // A line that only repeats the name says nothing: say what it is instead.
  const body =
    own.length >= 40 && squash(own) !== squash(name)
      ? own
      : `${tidyName(name)}${type ? `, ${type.toLocaleLowerCase("tr")}` : ""}`;
  return `${fit(body, DESCRIPTION_MAX - tail.length - 1)} ${tail}`;
}
