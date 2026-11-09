/**
 * "Tüm Ürünlere Toplu Ayar Uygula": the product sheet's "Genel Kurallar" and
 * the catalogue's "KDV gösterimi", written on every product of a category at
 * once. Every field starts at "Değiştirme" and only the ones the admin changes
 * are sent, so switching one rule never resets the others product by product.
 */

import type { CatalogSegment, ErpDisplayField } from "@/lib/erpCatalog";

// lib/erpCatalog's, typed against it; kept here so `npm test` reads this file alone.
const SEGMENT_FIELDS: Record<CatalogSegment, ErpDisplayField> = {
  DEALER: "erp_display_bayi",
  WHOLESALE: "erp_display_toptan",
  CAFE: "erp_display_kafe",
  RETAIL: "erp_display_perakende",
};
const SEGMENTS = Object.keys(SEGMENT_FIELDS) as CatalogSegment[];

/** The sheet's yes/no rules, in its order. */
export const BULK_RULES = [
  "is_free_shipping",
  "has_havale_discount",
  "has_dealer_havale_discount",
  "has_toptan_havale_discount",
  "has_cafe_havale_discount",
  "has_volume_discount",
  "gives_points",
  "can_use_points",
  "is_cart_rule_applied",
] as const;
export type BulkRule = (typeof BULK_RULES)[number];

/** A rule: left as each product has it, or set to yes or no. */
export type RuleChoice = "keep" | "yes" | "no";
/** "Adet şartı": left, dropped, or set to this many units (as typed). */
export type QuantityChoice = { mode: "keep" } | { mode: "none" } | { mode: "set"; value: string };
/** A group's "KDV gösterimi": left, "KDV hariç göster", "KDV dahil göster", or the choice removed. */
export type DisplayChoice = "keep" | "excl" | "incl" | "clear";

export interface BulkDraft {
  includeSubcategories: boolean;
  rules: Record<BulkRule, RuleChoice>;
  minQuantity: QuantityChoice;
  display: Record<CatalogSegment, DisplayChoice>;
}

/** The request: only the fields to write. */
export type CategoryBulkSettings = { include_subcategories: boolean } & Partial<Record<BulkRule, boolean>> & {
  free_shipping_min_quantity?: number | null;
} & Partial<Record<ErpDisplayField, boolean | null>>;

export function emptyBulkDraft(): BulkDraft {
  return {
    includeSubcategories: true,
    rules: Object.fromEntries(BULK_RULES.map((r) => [r, "keep"])) as Record<BulkRule, RuleChoice>,
    minQuantity: { mode: "keep" },
    display: Object.fromEntries(SEGMENTS.map((s) => [s, "keep"])) as Record<CatalogSegment, DisplayChoice>,
  };
}

/** A whole number of units from 1, or null. */
export function parseQuantity(raw: string): number | null {
  const s = raw.trim();
  if (!/^\d{1,6}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= 100000 ? n : null;
}

/** How many fields the draft writes. */
export function changeCount(draft: BulkDraft): number {
  return (
    BULK_RULES.filter((r) => draft.rules[r] !== "keep").length +
    (draft.minQuantity.mode === "keep" ? 0 : 1) +
    SEGMENTS.filter((s) => draft.display[s] !== "keep").length
  );
}

/**
 * The request for the draft, or why it can't go: nothing chosen, or an "Adet
 * şartı" that is not a whole number of units.
 */
export function bulkBody(draft: BulkDraft): { body: CategoryBulkSettings } | { error: string } {
  if (changeCount(draft) === 0) return { error: "Uygulanacak bir ayar seçin." };
  const body: CategoryBulkSettings = { include_subcategories: draft.includeSubcategories };
  for (const rule of BULK_RULES) {
    const choice = draft.rules[rule];
    if (choice !== "keep") body[rule] = choice === "yes";
  }
  if (draft.minQuantity.mode === "none") body.free_shipping_min_quantity = null;
  if (draft.minQuantity.mode === "set") {
    const n = parseQuantity(draft.minQuantity.value);
    if (n === null) return { error: "Adet şartı 1 ya da daha büyük bir tam sayı olmalı." };
    body.free_shipping_min_quantity = n;
  }
  for (const segment of SEGMENTS) {
    const choice = draft.display[segment];
    if (choice !== "keep") body[SEGMENT_FIELDS[segment]] = choice === "clear" ? null : choice === "incl";
  }
  return { body };
}
