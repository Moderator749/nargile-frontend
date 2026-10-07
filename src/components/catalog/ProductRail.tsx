"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SectionHeader } from "@/components/home/SectionHeader";

interface ProductRailProps {
  id: string;
  eyebrow: string;
  title: string;
  /** Extra header action (e.g. "Tümünü gör"), shown before the arrows. */
  action?: ReactNode;
  items: { key: string; node: ReactNode }[];
  busy?: boolean;
}

const arrowClass =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-sm shadow-black/[0.06] ring-1 ring-inset ring-black/[0.06] dark:bg-zinc-800 dark:ring-white/10 dark:shadow-none transition-[opacity,box-shadow] duration-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-30 disabled:shadow-none";

/**
 * Horizontal product row (scroll-snap): 4 cards per view on desktop, 2 on
 * tablets, ~1.2 on phones so the next card peeks in. Swipe natively; the arrows
 * page by one full view.
 */
export function ProductRail({ id, eyebrow, title, action, items, busy = false }: ProductRailProps) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft >= max - 1 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure, items.length]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <section aria-labelledby={id} aria-busy={busy || undefined}>
      <SectionHeader
        id={id}
        eyebrow={eyebrow}
        title={title}
        action={
          <div className="flex shrink-0 items-center gap-4">
            {action}
            {items.length > 1 && (
              <div className="hidden gap-2 sm:flex">
                <button type="button" onClick={() => page(-1)} disabled={edges.start} aria-label="Önceki ürünler" className={arrowClass}>
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => page(1)} disabled={edges.end} aria-label="Sonraki ürünler" className={arrowClass}>
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
        }
      />
      {/* Padding keeps hover shadows and lift unclipped; negative side/bottom margins cancel it. */}
      <ul
        ref={track}
        className="-mx-4 -mb-6 mt-2 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 py-6 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {items.map(({ key, node }) => (
          <li
            key={key}
            className="flex w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)] [&>*]:flex-1"
          >
            {node}
          </li>
        ))}
      </ul>
    </section>
  );
}
