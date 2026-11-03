"use client";

import { useEffect, useState } from "react";

import type { ListingScope } from "@/lib/catalogParts";
import type { CatalogProduct } from "@/types";

/**
 * What a grid hands its catalogue buttons ("PDF Oluştur", "Fiyat Kataloğu
 * İndir"): the products as shown and, where the grid has only some of the
 * listing loaded, the way to the rest of it, so a catalogue is always the
 * listing whole and never only what "Daha fazla göster" has brought in.
 */
export interface CatalogListing {
  /** The grid as shown: filtered and sorted. */
  products: CatalogProduct[];
  /** Every product of the listing, unfiltered; absent when `products` already is all of it. */
  loadAll?: (signal: AbortSignal) => Promise<CatalogProduct[]>;
  /** The grid's filters, order and sub-category chip, for what `loadAll` brings. */
  select?: (all: CatalogProduct[]) => CatalogProduct[];
  /** What the products are, for the count's sentence. */
  scope: ListingScope;
}

export type ListingState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; products: CatalogProduct[] };

/**
 * The catalogue's products, for a dialog that is open: the grid's own when it
 * has them all, else the whole listing, fetched as the dialog opens and put
 * through the grid's filters and order.
 */
export function useCatalogListing({ products, loadAll, select }: CatalogListing): ListingState {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ attempt: number; products: CatalogProduct[] | null } | null>(null);

  useEffect(() => {
    if (!loadAll) return;
    const controller = new AbortController();
    loadAll(controller.signal).then(
      (all) => setLoaded({ attempt, products: all }),
      () => {
        if (!controller.signal.aborted) setLoaded({ attempt, products: null });
      },
    );
    return () => controller.abort();
  }, [loadAll, attempt]);

  if (!loadAll) return { status: "ready", products };
  if (loaded?.attempt !== attempt) return { status: "loading" };
  if (!loaded.products) return { status: "error", retry: () => setAttempt((a) => a + 1) };
  return { status: "ready", products: select ? select(loaded.products) : loaded.products };
}
