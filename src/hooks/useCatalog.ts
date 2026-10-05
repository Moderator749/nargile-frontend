"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import { CATALOG_PAGE_SIZE, fetchProducts } from "@/lib/catalogApi";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct } from "@/types";

interface CatalogResult {
  key: string;
  products: CatalogProduct[];
  error: string | null;
  hasMore: boolean;
}

const LOAD_ERROR = "Ürünler yüklenemedi. Lütfen tekrar deneyin.";

/**
 * Loads the catalog priced for the current user. Waits for auth hydration so B2B
 * users never see a flash of RETAIL prices, and refetches when the user changes.
 */
export function useCatalog() {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<CatalogResult | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Identifies which user/attempt the current data belongs to.
  const key = hydrated ? `${token ?? "anon"}:${attempt}` : null;
  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  });

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    fetchProducts({}, controller.signal)
      .then((products) =>
        setResult({ key, products, error: null, hasMore: products.length === CATALOG_PAGE_SIZE }),
      )
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setResult({ key, products: [], error: getApiErrorMessage(err, LOAD_ERROR), hasMore: false });
      });
    return () => controller.abort();
  }, [key]);

  const current = result && result.key === key ? result : null;

  const loadMore = useCallback(async () => {
    if (!current || loadingMore) return;
    const requestKey = current.key;
    setLoadingMore(true);
    try {
      const next = await fetchProducts({ skip: current.products.length });
      // Drop the page if the user logged in/out meanwhile (prices would be mixed).
      if (keyRef.current !== requestKey) return;
      setResult((prev) =>
        prev && prev.key === requestKey
          ? {
              ...prev,
              products: [...prev.products, ...next],
              hasMore: next.length === CATALOG_PAGE_SIZE,
            }
          : prev,
      );
    } catch (err) {
      if (keyRef.current !== requestKey) return;
      setResult((prev) =>
        prev && prev.key === requestKey
          ? { ...prev, error: getApiErrorMessage(err, LOAD_ERROR) }
          : prev,
      );
    } finally {
      setLoadingMore(false);
    }
  }, [current, loadingMore]);

  return {
    products: current?.products ?? [],
    loading: current === null,
    error: current?.error ?? null,
    hasMore: current?.hasMore ?? false,
    loadingMore,
    loadMore,
    retry: () => setAttempt((a) => a + 1),
  };
}
