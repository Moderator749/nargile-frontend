/**
 * The calculator's tie to a saved row: which row "Kaydet" writes over, and
 * how a row's application to the site stands. Pure, so `npm test` reads it.
 */

/** The row a calculator was loaded from (or last saved to): its id and where it is. */
export interface PricingOrigin {
  id: string;
  code: string;
  name: string;
  /** Its old folder ("Dosya"), shown as a label; null for none. */
  fileId: number | null;
  fileName: string | null;
}

interface SavedRow {
  id: string;
  product_code: string;
  product_name: string;
  file_id: number | null;
  file_name: string | null;
}

export const originOf = (r: SavedRow): PricingOrigin => ({
  id: r.id,
  code: r.product_code,
  name: r.product_name,
  fileId: r.file_id,
  fileName: r.file_name,
});

/**
 * Whether a row's prices are on the site: never applied; applied as it
 * stands; or applied and saved over since — the site has its earlier
 * version's prices ("Sitede · önceki hali").
 */
export function appliedState(r: { applied_at: string | null; updated_at: string }): "none" | "current" | "earlier" {
  if (!r.applied_at) return "none";
  return Date.parse(r.updated_at) > Date.parse(r.applied_at) ? "earlier" : "current";
}

/**
 * Whether "Kaydet" writes over the tied row without a question: the code is
 * still that row's (spaces and case aside), as the server decides it. A new
 * sheet, or a changed code, is a new row — asked about when the code is saved.
 */
export const savesOver = (origin: Pick<PricingOrigin, "code"> | null, code: string): boolean =>
  origin !== null && origin.code.trim().toLowerCase() === code.trim().toLowerCase();
