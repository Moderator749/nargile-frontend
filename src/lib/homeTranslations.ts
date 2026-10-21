/**
 * The homepage's texts in English and Arabic: a translation memory.
 *
 * Everything the admin edits in "Ana Sayfa Düzenleme" — section titles, the
 * hero slides, campaign boxes, menu labels, the footer — and the defaults the
 * storefront shows where nothing was saved, is translated by looking each
 * Turkish text up, exactly as it is, in a stored map (backend
 * `/home/translations`, edited in the panel's "Çeviriler" tab). A text found
 * there is swapped for its translation; one that is not stays Turkish. So
 * reordering sections or slides never misaligns a translation, a text used
 * twice is translated once, and a text the admin rewrites shows in Turkish
 * until it is translated again — the panel lists it as missing.
 *
 * No path aliases here: `npm test` imports this file as it is.
 */

export type TextMemory = Record<string, string>;

export interface HomeTranslations {
  en: TextMemory;
  ar: TextMemory;
  updated_at?: string | null;
}

/** Fields that are addresses, ids, switches or search terms, never words on the page. */
const NOT_TEXT = new Set([
  "id", "slug", "brand", "search", "href", "cta_href", "guest_cta_href", "instagram_href", "youtube_href", "whatsapp_href",
  "image", "image_url", "image_urls", "url", "icon", "kind", "email", "phone", "requires", "text_align", "layout",
  "style", "tone", "slide_id", "hidden", "order", "sections", "updated_at",
]);

/** A string that is a token (an enum, a slug), an address or a number: nothing to translate. */
const notWords = (text: string) =>
  !/\p{L}/u.test(text) || /^[a-z0-9_.-]+$/.test(text) || /^(?:\/|#|https?:|mailto:|tel:)/.test(text) || /^[^@\s]+@[^@\s]+$/.test(text);

/** Every translatable text in a homepage document (or slide list), in order of first appearance. */
export function collectTexts(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (typeof value === "string") {
    const text = value.trim();
    if (text && !notWords(text)) into.add(text);
  } else if (Array.isArray(value)) {
    for (const item of value) collectTexts(item, into);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) if (!NOT_TEXT.has(key)) collectTexts(item, into);
  }
  return into;
}

/** The same value with every text the memory knows in its translation; the rest untouched. */
export function translateTexts<T>(value: T, memory: TextMemory | undefined): T {
  if (!memory || Object.keys(memory).length === 0) return value;
  const walk = (item: unknown): unknown => {
    if (typeof item === "string") return memory[item.trim()] ?? item;
    if (Array.isArray(item)) return item.map(walk);
    if (item && typeof item === "object") {
      return Object.fromEntries(Object.entries(item).map(([key, v]) => [key, NOT_TEXT.has(key) ? v : walk(v)]));
    }
    return item;
  };
  return walk(value) as T;
}
