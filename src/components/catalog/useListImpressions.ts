"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";

import { trackListImpression, type GaItem, type GaList } from "@/lib/gaEvents";

/**
 * Google Analytics' view_item_list for a list drawn inline rather than from
 * ProductCard (which reports itself): every element under `container` marked
 * `data-ga-index` is reported once half of it is in sight — the carousel's
 * clipped slides only when scrolled into view — as `itemAt(index)`. A slide
 * repeated for a looping carousel is left unmarked, so it counts once.
 * `key` changes when the items do (a new search term), to look again.
 */
export function useListImpressions(
  container: RefObject<HTMLElement | null>,
  list: GaList,
  itemAt: (index: number) => GaItem | null,
  key: string,
): void {
  const report = useEffectEvent((index: number) => {
    const gaItem = itemAt(index);
    if (gaItem) trackListImpression(list, gaItem, index);
  });
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.gaIndex);
          if (Number.isInteger(index)) report(index);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 },
    );
    root.querySelectorAll<HTMLElement>("[data-ga-index]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [container, key]);
}
