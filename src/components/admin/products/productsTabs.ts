/**
 * "Ürünler & Stok"'s tabs, in its address: `?sekme=siralama` opens
 * "Kategori Vitrin Sıralaması", `?sekme=markalar` "Markalar" (absent: the
 * product list), and `sirala-kategori=<id>` the category the order shows.
 * The list writes its own filters into the same address; these are kept
 * beside them.
 */
export const TAB_PARAM = "sekme";
export const ORDER_TAB = "siralama";
export const BRANDS_TAB = "markalar";
export const ORDER_CATEGORY_PARAM = "sirala-kategori";

const WORKSPACE_PARAMS = [TAB_PARAM, ORDER_CATEGORY_PARAM] as const;

/** The list's own query with the tabs' params of the current address kept beside it. */
export function withWorkspaceParams(listQuery: string): string {
  const now = new URLSearchParams(window.location.search);
  const out = new URLSearchParams(listQuery);
  for (const key of WORKSPACE_PARAMS) {
    const value = now.get(key);
    if (value) out.set(key, value);
  }
  return out.toString();
}

/** The current address's query with the tabs' params changed (null drops one); the list's filters stay. */
export function withTabParams(patch: Partial<Record<(typeof WORKSPACE_PARAMS)[number], string | null>>): string {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(patch)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params.toString();
}
