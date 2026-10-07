"use client";

import { useSyncExternalStore } from "react";

import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

interface PersistApi {
  onFinishHydration: (fn: () => void) => () => void;
  hasHydrated: () => boolean;
}

// On the server there is no storage, so zustand omits `.persist` entirely.
const noSubscribe = () => () => {};
const never = () => false;

function usePersistHydrated(persist: PersistApi | undefined): boolean {
  return useSyncExternalStore(
    persist?.onFinishHydration ?? noSubscribe,
    persist?.hasHydrated ?? never,
    never,
  );
}

/** True once the persisted auth state has loaded from localStorage. */
export function useAuthHydrated(): boolean {
  return usePersistHydrated(useAuthStore.persist);
}

/** True once the persisted cart has loaded from localStorage. */
export function useCartHydrated(): boolean {
  return usePersistHydrated(useCartStore.persist);
}
