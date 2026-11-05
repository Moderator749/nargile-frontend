/**
 * The round trip from "Çeviriler › Çeviri Onayları" to a product's sheet or a
 * category's editor and back. The approvals list links them with
 * `from=approvals#translations`: each opens at its "Çeviriler", and its way
 * back and a save return to the approvals tab — not the product list or the
 * homepage editor — with the saved name for a line saying so.
 */

export const FROM_PARAM = "from";
export const FROM_APPROVALS = "approvals";
/** The sheet's "Çeviriler" section, by its id. */
export const TRANSLATIONS_ANCHOR = "translations";

const TRANSLATIONS_PATH = "/admin/translations";
/** The tab parameter "Çeviriler" writes (`?sekme=onaylar`), and the English alias it also reads. */
export const TAB_PARAM = "sekme";
export const TAB_ALIAS = "tab";
/** After a save from the approvals: the product's name, for the tab to say it was saved. */
export const SAVED_PARAM = "kaydedildi";

export const APPROVALS_HREF = `${TRANSLATIONS_PATH}?${TAB_PARAM}=onaylar`;

/** The approvals list's link to a product: its sheet, at "Çeviriler", knowing where it came from. */
export function productApprovalHref(productId: string): string {
  return `/admin/products/${encodeURIComponent(productId)}?${FROM_PARAM}=${FROM_APPROVALS}#${TRANSLATIONS_ANCHOR}`;
}

/** The category editor ("Ana Sayfa Düzenleme › Katalog Kategorileri") opened on this category, at "Çeviriler". */
export const CATEGORY_PARAM = "kategori";
export function categoryApprovalHref(categoryId: number | string): string {
  const query = `tab=katalog-kategorileri&${CATEGORY_PARAM}=${encodeURIComponent(String(categoryId))}&${FROM_PARAM}=${FROM_APPROVALS}`;
  return `/admin/homepage?${query}#${TRANSLATIONS_ANCHOR}`;
}

/** Whether the sheet was opened from the approvals (`search` as in location.search). */
export function cameFromApprovals(search: string): boolean {
  return new URLSearchParams(search).get(FROM_PARAM) === FROM_APPROVALS;
}

/** Back to the approvals tab; with a name, it says that product was saved. */
export function approvalsHref(savedName?: string | null): string {
  return savedName ? `${APPROVALS_HREF}&${SAVED_PARAM}=${encodeURIComponent(savedName)}` : APPROVALS_HREF;
}

export type TranslationsTab = "texts" | "approvals";

/**
 * The tab an address asks for: `?sekme=ceviriler` (or `?tab=texts`) the
 * homepage texts; anything else — `?sekme=onaylar`, `?tab=approvals`, the bare
 * address of the old "Çeviri Onayları" page — the approvals.
 */
export function requestedTab(search: string): TranslationsTab {
  const params = new URLSearchParams(search);
  const tab = params.get(TAB_PARAM) ?? params.get(TAB_ALIAS);
  return tab === "ceviriler" || tab === "texts" ? "texts" : "approvals";
}
