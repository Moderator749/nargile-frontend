// URL slugs as the API makes them (saas_backend/app/core/slugs.py).

const TR: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };

/** "Çelik Takımlar" → "celik-takimlar": what the API derives from a name. */
export function slugify(text: string): string {
  return text
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (ch) => TR[ch])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Room left in the 255-character column for a failsafe "-NNN". */
const PRODUCT_SLUG_ROOM = 247;

/**
 * A new product's address, as the API gives it: its code, then its name —
 * "LH013" + "Legend Hookah Çantalı…" → "lh013-legend-hookah-cantali-…". The
 * code is unique, so namesakes never meet at "-2"; a name that already begins
 * with its code does not get it twice.
 */
export function productSlug(code: string, name: string): string {
  const nameSlug = slugify(name);
  const codeSlug = slugify(code);
  const base =
    codeSlug && nameSlug !== codeSlug && !nameSlug.startsWith(`${codeSlug}-`)
      ? nameSlug
        ? `${codeSlug}-${nameSlug}`
        : codeSlug
      : nameSlug;
  return base.slice(0, PRODUCT_SLUG_ROOM).replace(/^-+|-+$/g, "") || "urun";
}

/** The name as a page title: with its code, unless the name already says it ("NT665 Kırmızı"). */
export function nameWithCode(name: string, code: string): string {
  const codeSlug = slugify(code);
  return codeSlug && !`-${slugify(name)}-`.includes(`-${codeSlug}-`) ? `${name} (${code.trim()})` : name;
}

/** A product's slug: letters and digits in runs joined by single hyphens or dots (the old store's spelling). */
export const PRODUCT_SLUG = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
