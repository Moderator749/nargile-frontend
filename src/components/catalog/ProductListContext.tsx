"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { GaList } from "@/lib/gaEvents";

const ProductListContext = createContext<GaList | null>(null);

/**
 * Names the product list its cards are in, for Google Analytics'
 * view_item_list and select_item (lib/gaEvents): wrap a grid or a row once,
 * and every ProductCard inside reports itself as part of it. `id` is stable
 * ("category_luleler"), `name` Turkish whatever the page's language, so the
 * reports never split a list by language.
 */
export function ProductList({ id, name, children }: GaList & { children: ReactNode }) {
  const value = useMemo(() => ({ id, name }), [id, name]);
  return <ProductListContext.Provider value={value}>{children}</ProductListContext.Provider>;
}

/** The list a card is in, or null outside any (then it reports nothing). */
export function useProductList(): GaList | null {
  return useContext(ProductListContext);
}
