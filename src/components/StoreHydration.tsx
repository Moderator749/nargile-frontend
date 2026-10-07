"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";

/**
 * Loads persisted stores from localStorage after the first client render, so
 * the server HTML and the initial client render match.
 */
export function StoreHydration() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
    void useCartStore.persist.rehydrate();
    void useCurrencyStore.persist.rehydrate();
  }, []);

  return null;
}
