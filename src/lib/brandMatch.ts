import { slugify } from "@/lib/slug";
import type { Brand } from "@/types";

/** Whether `slug` is the brand's slug, or begins with it as a whole word ("legend-hookah" → "legend"). */
const startsWithBrand = (slug: string, brand: Brand) => slug === brand.slug || slug.startsWith(`${brand.slug}-`);

/** Of the brands that fit, the most specific: "mr-wood" before "mr", should both exist. */
const mostSpecific = (brands: Brand[]) =>
  brands.reduce<Brand | undefined>((best, b) => (!best || b.slug.length > best.slug.length ? b : best), undefined);

/**
 * The brand a category stands for, if any: the menu's "LEGEND HOOKAH" is the
 * category `legend` ("Legend Hookah"), which is Legend's canonical page — so
 * it wears Legend's logo. Matched by the category's slug or name, each as the
 * brand's slug or that followed by more words; active brands only.
 */
export function brandForCategory(category: { slug: string; name: string }, brands: Brand[]): Brand | undefined {
  const active = brands.filter((b) => b.is_active);
  const exact = active.find((b) => b.slug === category.slug);
  if (exact) return exact;
  const nameSlug = slugify(category.name);
  return mostSpecific(active.filter((b) => startsWithBrand(category.slug, b) || startsWithBrand(nameSlug, b)));
}

/**
 * The brand an address under /marka/ means: its own slug, or another spelling
 * of it — its name or search term as a slug ("mr.wood" → "mr-wood"), or the
 * brand followed by more words ("legend-hookah"). Active brands only.
 */
export function brandForSlug(slug: string, brands: Brand[]): Brand | undefined {
  const active = brands.filter((b) => b.is_active);
  // The address as a slug too: "mr.wood" and "Mr.Wood" both read "mr-wood".
  const key = slugify(slug);
  return (
    active.find((b) => b.slug === slug) ??
    active.find((b) => b.slug === key || slugify(b.name) === key || slugify(b.search_term) === key) ??
    mostSpecific(active.filter((b) => startsWithBrand(key, b)))
  );
}
