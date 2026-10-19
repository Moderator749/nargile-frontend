"use client";

import { useEffect } from "react";

import { renewSession } from "@/lib/session";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";

/**
 * Loads persisted stores from localStorage after the first client render, so
 * the server HTML and the initial client render match — and renews the
 * session on each visit, and when the tab comes back into view, so a signed-in
 * customer stays signed in while they keep coming back (see lib/session).
 */
export function StoreHydration() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
    void useCartStore.persist.rehydrate();
    void useCurrencyStore.persist.rehydrate();
    void renewSession();
    const onVisible = () => {
      if (document.visibilityState === "visible") void renewSession();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return null;
}
