// The catalog grid's density on a phone: two products per row (the default)
// or one, full width. A visitor's choice, kept in this browser.

import { useSyncExternalStore } from "react";

export type CatalogDensity = "two" | "one";

const KEY = "nargile-catalog-view";
const listeners = new Set<() => void>();

function read(): CatalogDensity {
  try {
    return window.localStorage.getItem(KEY) === "one" ? "one" : "two";
  } catch {
    return "two"; // storage blocked (private mode): the default, every time
  }
}

export function setCatalogDensity(value: CatalogDensity): void {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Not kept, but still applied for this page through the listeners.
  }
  current = value;
  listeners.forEach((l) => l());
}

let current: CatalogDensity | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab's choice follows here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The visitor's choice; "two" on the server and until hydrated, so the markup matches. */
export function useCatalogDensity(): CatalogDensity {
  return useSyncExternalStore(
    subscribe,
    () => (current ??= read()),
    () => "two",
  );
}
