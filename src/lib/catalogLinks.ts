import type { Category } from "@/types";

/**
 * The category slug an old-style link names (/catalog/<slug>, where category
 * pages were until 2026-10-29). A link at the root (/<slug>) is not checked:
 * products share that namespace, so a slug that is no category may well be one.
 */
export function catalogSlugOf(href: string | null | undefined): string | null {
  const match = href?.trim().match(/^\/catalog\/([^/?#]+)\/?(?:[?#].*)?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Plain-ASCII words of a slug or name, for loose matching ("Kömürler" → "komurler"). */
const words = (text: string) =>
  text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c] ?? c)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Words too common in this catalog to say which category is meant. */
const GENERIC = new Set(["nargile", "urunler", "urun", "ve"]);

/** How many leading letters two words share, counted only from four up. */
function sharedStart(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i >= 4 ? i : 0;
}

/**
 * A link to a category page that does not exist (a typo, or a category that
 * was renamed or switched off) — the storefront would answer it with a 404.
 * Returns the missing slug and the closest real category, if one shares a
 * word with it; null when the link is fine or is not a category link.
 */
export function brokenCategoryLink(
  href: string | null | undefined,
  categories: Category[],
): { slug: string; suggestion: Category | null } | null {
  const slug = catalogSlugOf(href);
  if (!slug || categories.length === 0 || categories.some((c) => c.slug === slug)) return null;
  // Words every category shares tell nothing apart ("nargile"); the rest are
  // compared by their common start, so "komurleri" finds "komurler".
  const wanted = words(slug).filter((w) => !GENERIC.has(w));
  let best: Category | null = null;
  let bestScore = 0;
  for (const c of categories) {
    const theirs = [...words(c.slug), ...words(c.name)].filter((w) => !GENERIC.has(w));
    const score = wanted.reduce((sum, w) => sum + Math.max(0, ...theirs.map((t) => sharedStart(w, t))), 0);
    if (score > bestScore) [best, bestScore] = [c, score];
  }
  return { slug, suggestion: best };
}
