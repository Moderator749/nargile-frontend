"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { canOptimiseImage } from "@/lib/home";
import { homeMessages } from "@/lib/i18n/messages/home";
import { PAGE_CONTAINER } from "@/lib/layout";
import type { HomeBento, HomeBentoTile } from "@/types";

/** The first three boxes of a tab stand tall; the last two lie wide, stacked beside them. */
const TALL = 3;

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

const TALL_BOX =
  "h-80 w-[64%] shrink-0 snap-start sm:h-96 sm:w-[44%] md:col-span-2 md:aspect-[3/4] md:h-auto md:w-auto lg:col-span-1 lg:row-span-2 lg:aspect-auto";
const WIDE_BOX =
  "h-80 w-[86%] shrink-0 snap-start sm:h-96 sm:w-[66%] md:col-span-3 md:aspect-[16/9] md:h-auto md:w-auto lg:col-span-1 lg:aspect-auto";

function Box({ tile, tall, fallbackName }: { tile: HomeBentoTile; tall: boolean; fallbackName: string }) {
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
        sizes={tall ? TALL_SIZES : WIDE_SIZES}
        unoptimized={!canOptimiseImage(tile.image)}
        style={{ objectPosition: `${tile.focus_x}% 50%` }}
        className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
      />
    </Link>
  );
}

/**
 * "Görsel Vitrin", over the deals: two tabs of photo boxes, no words on them —
 * three tall boxes side by side and two wide ones stacked beside them, a
 * bento the tab swaps whole. The tabs work as the old Közlükler band's did
 * (a pill switch, the panel keyed on the tab so the new photos fade in), with
 * the arrow keys moving between them. Below `md` the boxes run in one row
 * that is swiped sideways, each snapping into place.
 */
export function BentoShowcase({ copy }: { copy: HomeBento }) {
  const t = useMessages(homeMessages).bento;
  const [active, setActive] = useState(0);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = copy.tabs[active] ?? copy.tabs[0];
  if (!tab) return null;

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
    <section aria-label={t.label} className="w-full bg-white py-10 md:py-14 dark:bg-transparent">
      <div className={PAGE_CONTAINER}>
        <div className="mb-6 flex justify-center md:mb-8">
          <div
            role="tablist"
            aria-label={t.label}
            onKeyDown={onKeyDown}
            className="inline-flex gap-1 rounded-full bg-neutral-100 p-1 ring-1 ring-inset ring-black/5 dark:bg-white/5 dark:ring-white/10"
          >
            {copy.tabs.map((x, i) => {
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
                  aria-controls={`${base}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                    selected
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-white dark:text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyed on the tab: a switch fades the other photos in. */}
        <ul
          key={active}
          id={`${base}-panel`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${active}`}
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] motion-safe:animate-perks-in sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible md:px-0 lg:h-[clamp(26rem,36vw,31rem)] lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.45fr)] lg:grid-rows-2 [&::-webkit-scrollbar]:hidden"
        >
          {tab.tiles.map((tile, i) => (
            <li key={i} className={i < TALL ? TALL_BOX : WIDE_BOX}>
              <Box tile={tile} tall={i < TALL} fallbackName={tab.label} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
