"use client";

import { useSyncExternalStore } from "react";

import { useAuthStore } from "@/store/useAuthStore";

const subscribe = (onChange: () => void) => useAuthStore.persist.onFinishHydration(onChange);
const getSnapshot = () => useAuthStore.persist.hasHydrated();
const getServerSnapshot = () => false;

/** True once the persisted auth state has loaded from localStorage. */
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
