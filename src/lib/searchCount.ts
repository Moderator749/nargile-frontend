import { useSyncExternalStore } from "react";

/**
 * How many products the catalog grid found for a search, for the page's
 * heading above it ("‘lule’ için 48 sonuç"): the heading is rendered with the
 * page, the grid finds out in the browser, and this is how one tells the other.
 */
export interface SearchCount {
  query: string;
  count: number;
  /** More to load behind the ones counted. */
  more: boolean;
}

let current: SearchCount | null = null;
const listeners = new Set<() => void>();

export function publishSearchCount(next: SearchCount | null) {
  if (current?.query === next?.query && current?.count === next?.count && current?.more === next?.more) return;
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSearchCount(): SearchCount | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
