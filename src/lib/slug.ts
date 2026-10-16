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

/** A product's slug: letters and digits in runs joined by single hyphens or dots (the old store's spelling). */
export const PRODUCT_SLUG = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
