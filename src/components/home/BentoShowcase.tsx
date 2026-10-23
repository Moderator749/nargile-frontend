"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Image from "next/image";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { canOptimiseImage } from "@/lib/home";
import { homeMessages } from "@/lib/i18n/messages/home";
import { PAGE_CONTAINER } from "@/lib/layout";
import type { HomeBento, HomeBentoLayout, HomeBentoTile } from "@/types";

/** A fast start and a long, soft landing: the slide and the height change share it. */
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/*
 * Each box's shape, per arrangement and place. Below `md` every box is one in
 * a row swiped sideways, snapping into place.
 *
 * "bento": the first three stand tall side by side, the last two lie wide,
 * stacked beside them (on tablets: the three, then the two under them).
 * "row": three 16:9 boxes across the width.
 */
const TALL_BOX =
  "h-80 w-[64%] shrink-0 snap-start sm:h-96 sm:w-[44%] md:col-span-2 md:aspect-[3/4] md:h-auto md:w-auto lg:col-span-1 lg:row-span-2 lg:aspect-auto";
const WIDE_BOX =
  "h-80 w-[86%] shrink-0 snap-start sm:h-96 sm:w-[66%] md:col-span-3 md:aspect-[16/9] md:h-auto md:w-auto lg:col-span-1 lg:aspect-auto";
const ROW_BOX = "aspect-video w-[86%] shrink-0 snap-start sm:w-[66%] md:w-auto";

const LIST =
  "flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] sm:scroll-px-6 sm:px-6 md:grid md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden";
const LISTS: Record<HomeBentoLayout, string> = {
  bento: `${LIST} md:grid-cols-6 lg:h-[clamp(26rem,36vw,31rem)] lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.45fr)] lg:grid-rows-2`,
  row: `${LIST} md:grid-cols-3`,
};

/*
 * How wide a photo to fetch. A box crops its photo to fill it, so a wide
 * (16:9) photo in a tall box is drawn as wide as the box is high × 1.8, not
 * as wide as the box: sized for the box alone it would be fetched small and
 * blown up soft. A tall box is ~36vw high from `lg` (the grid's height), 4/3 of
 * its third of the row at `md`, and 320px (20rem) on a phone, where a wide box
 * is as high too. A portrait photo uploaded for a tall box is over-fetched by
 * this, which the image optimiser's WebP keeps light.
 */
const TALL_SIZES = "(min-width: 1024px) 64vw, (min-width: 768px) 80vw, 580px";
const WIDE_SIZES = "(min-width: 1024px) 32vw, (min-width: 768px) 50vw, 580px";
const ROW_SIZES = "(min-width: 768px) 33vw, 86vw";

function boxOf(layout: HomeBentoLayout, i: number): { className: string; sizes: string } {
  if (layout === "row") return { className: ROW_BOX, sizes: ROW_SIZES };
  return i < 3 ? { className: TALL_BOX, sizes: TALL_SIZES } : { className: WIDE_BOX, sizes: WIDE_SIZES };
}

function Box({ tile, sizes, eager, fallbackName }: { tile: HomeBentoTile; sizes: string; eager: boolean; fallbackName: string }) {
  return (
    <Link
      href={tile.href}
      className="group relative block h-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-white/5 dark:ring-white/10"
    >
      <Image
        src={tile.image}
        // No words on the box: its photo names the link.
        alt={tile.alt || fallbackName}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        unoptimized={!canOptimiseImage(tile.image)}
        style={{ objectPosition: `${tile.focus_x}% 50%` }}
        className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
      />
    </Link>
  );
}

/**
 * "Görsel Vitrin", over the deals: two tabs of photo boxes, no words on them,
 * each tab in its own arrangement ("Yeni Gelenler" a bento of three tall
 * boxes and two wide, "Popüler" a row of three 16:9). The tabs work as the old
 * Közlükler band's did (a pill switch), with the arrow keys moving between
 * them.
 *
 * Both arrangements sit side by side on one track that slides the chosen one
 * into view — leftwards for the next tab, the other way back; mirrored in
 * Arabic — while the window's height eases to the new one's, the row being
 * far shorter than the bento. The one out of view is inert, so its links are
 * neither tabbed to nor read. Its photos are fetched once the section comes
 * near, so it never slides in blank.
 */
export function BentoShowcase({ copy }: { copy: HomeBento }) {
  const t = useMessages(homeMessages).bento;
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState<number>();
  const [near, setNear] = useState(false);
  const base = useId();
  const section = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  // The window takes the shown panel's height, and follows it as it resizes.
  useEffect(() => {
    const panel = panels.current[active];
    if (!panel) return;
    const observer = new ResizeObserver(() => setHeight(panel.offsetHeight));
    observer.observe(panel);
    return () => observer.disconnect();
  }, [active]);

  // Near the screen: fetch the other tab's photos too.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (copy.tabs.length === 0) return null;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const count = copy.tabs.length;
    // In Arabic the tabs run from the right: the arrows follow what is seen.
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
    const next =
      step !== undefined ? (active + step + count) % count : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <section ref={section} aria-label={t.label} className="w-full bg-white py-10 md:py-14 dark:bg-transparent">
      <div className={PAGE_CONTAINER}>
        <div className="mb-6 flex justify-center md:mb-8">
          <div
            role="tablist"
            aria-label={t.label}
            onKeyDown={onKeyDown}
            className="inline-flex gap-1 rounded-full bg-neutral-100 p-1 ring-1 ring-inset ring-black/5 dark:bg-white/5 dark:ring-white/10"
          >
            {copy.tabs.map((tab, i) => {
              const selected = i === active;
              return (
                <button
                  key={i}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  id={`${base}-tab-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${base}-panel-${i}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                    selected
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-white dark:text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* The window: edge to edge on a phone (each row swipes to the
            screen's edges), the container's width from `md`, with a little
            room so a focused box's outline is not cut off. */}
        <div
          className={`-mx-4 -my-1 overflow-hidden transition-[height] duration-500 motion-reduce:transition-none sm:-mx-6 md:-mx-1 ${EASE}`}
          style={height === undefined ? undefined : { height }}
        >
          <div
            className={`flex items-start transition-transform duration-500 will-change-transform motion-reduce:transition-none [transform:translateX(calc(var(--slide)*-100%))] rtl:[transform:translateX(calc(var(--slide)*100%))] ${EASE}`}
            style={{ "--slide": active } as CSSProperties}
          >
            {copy.tabs.map((tab, i) => {
              const shown = i === active;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    panels.current[i] = el;
                  }}
                  id={`${base}-panel-${i}`}
                  role="tabpanel"
                  aria-labelledby={`${base}-tab-${i}`}
                  aria-hidden={!shown || undefined}
                  inert={!shown}
                  // The room for a focused box's outline is the panel's own, so its height counts it.
                  className="w-full shrink-0 py-1 md:px-1"
                >
                  <ul className={LISTS[tab.layout]}>
                    {tab.tiles.map((tile, j) => {
                      const box = boxOf(tab.layout, j);
                      return (
                        <li key={j} className={box.className}>
                          <Box tile={tile} sizes={box.sizes} eager={near} fallbackName={tab.label} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
