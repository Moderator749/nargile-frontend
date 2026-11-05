"use client";

import { useEffect, useState } from "react";

import { cameFromApprovals } from "@/lib/translationReturn";

/**
 * The way back to the product list as it was left: its category, search, sort
 * and page. The list writes them into its own URL (so the browser's Back
 * restores them too) and remembers that URL here, for the sheet's "Geri Dön".
 */

export const PRODUCTS_PATH = "/admin/products";
const KEY = "admin-products-list";

export function rememberProductList(query: string): void {
  try {
    sessionStorage.setItem(KEY, query);
  } catch {
    // Storage blocked: "Geri Dön" leads to the plain list.
  }
}

/** The list's address as last left in this tab; the plain list until it is read (and on the server). */
export function useProductListHref(): string {
  const [href, setHref] = useState(PRODUCTS_PATH);
  useEffect(() => {
    try {
      const query = sessionStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage exists only after mount
      if (query) setHref(`${PRODUCTS_PATH}?${query}`);
    } catch {
      // As above.
    }
  }, []);
  return href;
}

/**
 * Whether the sheet was opened from "Çeviri Onayları" (`?from=approvals`):
 * then its way back is that tab, not the list. Read after mount, as the list's
 * address is: the query is not known while the page renders on the server.
 */
export function useFromApprovals(): boolean {
  const [from, setFrom] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- location exists only after mount
    setFrom(cameFromApprovals(window.location.search));
  }, []);
  return from;
}
