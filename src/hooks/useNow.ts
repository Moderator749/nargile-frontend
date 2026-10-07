"use client";

import { useSyncExternalStore } from "react";

// One shared ticker for every subscriber, aligned to whole seconds so all
// countdowns on the page flip together.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

function tick() {
  listeners.forEach((notify) => notify());
  timer = setTimeout(tick, 1000 - (Date.now() % 1000));
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  if (listeners.size === 1) timer = setTimeout(tick, 1000 - (Date.now() % 1000));
  return () => {
    listeners.delete(notify);
    if (listeners.size === 0) clearTimeout(timer);
  };
}

const noSubscribe = () => () => {};
const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000;
const getServerSnapshot = () => null;

/**
 * Current time in ms, floored to the second and updated every second.
 * Null during SSR and hydration, so server and client markup always match;
 * `enabled: false` reads the time once without ticking.
 */
export function useNow(enabled = true): number | null {
  return useSyncExternalStore(enabled ? subscribe : noSubscribe, getSnapshot, getServerSnapshot);
}
