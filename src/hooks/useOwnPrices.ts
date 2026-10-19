"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { fetchProductsByIds } from "@/lib/catalogApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct } from "@/types";

/**
 * The signed-in visitor's own copies of these server-rendered products, priced
 * for their segment and fetched in one request; null for a guest, and until
 * that request answers. While it is null a signed-in visitor's prices stay
 * masked (`public-price`), never showing a figure that is not theirs.
 */
export function useOwnPrices(products: CatalogProduct[]): Map<string, CatalogProduct> | null {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [own, setOwn] = useState<{ token: string; byId: Map<string, CatalogProduct> } | null>(null);
  // Keyed on the ids, not the array: a caller may build it afresh every render.
  const ids = [...new Set(products.map((p) => p.id))].join(",");

  useEffect(() => {
    if (!hydrated || !token || !ids) return;
    const controller = new AbortController();
    fetchProductsByIds(ids.split(","), controller.signal)
      .then((found) => setOwn({ token, byId: new Map(found.map((p) => [p.id, p])) }))
      .catch((err: unknown) => {
        // Unpriced for this account is still better than a guest's price.
        if (!axios.isCancel(err)) setOwn({ token, byId: new Map() });
      });
    return () => controller.abort();
  }, [hydrated, token, ids]);

  return hydrated && token && own?.token === token ? own.byId : null;
}
