"use client";

import { useSyncExternalStore } from "react";

import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

interface PersistApi {
  onFinishHydration: (fn: () => void) => () => void;
  hasHydrated: () => boolean;
}

function usePersistHydrated(persist: PersistApi): boolean {
  return useSyncExternalStore(persist.onFinishHydration, persist.hasHydrated, () => false);
}

/** True once the persisted auth state has loaded from localStorage. */
export function useAuthHydrated(): boolean {
  return usePersistHydrated(useAuthStore.persist);
}

/** True once the persisted cart has loaded from localStorage. */
export function useCartHydrated(): boolean {
  return usePersistHydrated(useCartStore.persist);
}
