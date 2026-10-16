"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import { CATALOG_PAGE_SIZE, fetchProducts } from "@/lib/catalogApi";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct } from "@/types";

interface CatalogPage {
  key: string;
  products: CatalogProduct[];
  error: string | null;
  hasMore: boolean;
}

interface UseCatalogOptions {
  category: string | null;
  query: string;
  /** Server-rendered anonymous (RETAIL) first page, or null if unavailable. */
  initialProducts: CatalogProduct[] | null;
  /** Products per page (must match the server-rendered page size). */
  pageSize?: number;
  /**
   * The search term `initialProducts` were rendered for: "" for a category or
   * the whole catalog, a brand's term on its brand page. While `query` is that
   * term, the server page is used as it is, like any other first page.
   */
  seedQuery?: string;
}

const LOAD_ERROR = "Ürünler yüklenemedi. Lütfen tekrar deneyin.";

/**
 * Catalog products priced for the current visitor.
 *
 * Anonymous visitors use the server-rendered page as-is (no client fetch). Logged-in
 * visitors keep seeing those products, with prices masked (`pricesPending`) until
 * their segment prices arrive. Search always fetches from the API.
 */
export function useCatalog({
  category,
  query,
  initialProducts,
  pageSize = CATALOG_PAGE_SIZE,
  seedQuery = "",
}: UseCatalogOptions) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState<CatalogPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const viewer = hydrated ? (token ?? "anon") : null;
  const key = viewer === null ? null : `${viewer}|${category ?? ""}|${query}|${attempt}`;
  const seed = initialProducts && query === seedQuery && attempt === 0 ? initialProducts : null;
  const seedIsFinal = viewer !== null && viewer === "anon" && seed !== null;

  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  });

  useEffect(() => {
    if (key === null || seedIsFinal) return;
    const controller = new AbortController();
    fetchProducts({ category, q: query, limit: pageSize }, controller.signal)
      .then((products) =>
        setPage({ key, products, error: null, hasMore: products.length === pageSize }),
      )
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setPage({ key, products: [], error: getApiErrorMessage(err, LOAD_ERROR), hasMore: false });
      });
    return () => controller.abort();
  }, [key, seedIsFinal, category, query, pageSize]);

  const fetched = page && page.key === key ? page : null;
  // While a new search loads, keep the previous results — but only the same
  // viewer's, so prices from another account (e.g. before logout) never show.
  const stale = page && viewer !== null && page.key.startsWith(`${viewer}|`) ? page : null;
  // Before hydration (and for logged-in visitors while loading) show the server
  // products; CSS masks their public prices for logged-in visitors.
  const showingSeed = !fetched && seed !== null;
  const view: Omit<CatalogPage, "key"> | null = useMemo(
    () =>
      fetched ??
      (seed ? { products: seed, error: null, hasMore: seed.length === pageSize } : null) ??
      stale,
    [fetched, seed, stale, pageSize],
  );

  const loadMore = useCallback(async () => {
    if (key === null || !view || loadingMore) return;
    const requestKey = key;
    const base = view.products;
    setLoadingMore(true);
    try {
      const next = await fetchProducts({ category, q: query, skip: base.length, limit: pageSize });
      // Drop the page if the viewer, category or query changed meanwhile.
      if (keyRef.current !== requestKey) return;
      setPage({
        key: requestKey,
        products: [...base, ...next],
        error: null,
        hasMore: next.length === pageSize,
      });
    } catch (err) {
      if (keyRef.current !== requestKey) return;
      setPage({ key: requestKey, products: base, error: getApiErrorMessage(err, LOAD_ERROR), hasMore: true });
    } finally {
      setLoadingMore(false);
    }
  }, [key, view, loadingMore, category, query, pageSize]);

  return {
    products: view?.products ?? [],
    /** Nothing to show yet (server data unavailable, or a first search in flight). */
    loading: view === null,
    /** A newer result is loading; `products` are the previous ones. */
    refreshing: view !== null && !fetched && !showingSeed,
    /** Products carry server-rendered public prices (CSS masks them for logged-in viewers). */
    publicPrices: showingSeed,
    /** Logged-in viewer whose own segment prices haven't arrived: block add-to-cart. */
    pricesPending: showingSeed && viewer !== null && viewer !== "anon",
    error: view?.error ?? null,
    hasMore: view?.hasMore ?? false,
    loadingMore,
    loadMore,
    retry: () => setAttempt((a) => a + 1),
  };
}
