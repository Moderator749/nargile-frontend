"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { HERO_FRAME, HeroBackdrop, HeroSlideView } from "@/components/home/HeroSlideView";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { homeMessages } from "@/lib/i18n/messages/home";
import type { HeroSlide } from "@/lib/home";

const AUTOPLAY_MS = 7000;

const controlClass =
  "flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300 ring-1 ring-inset ring-white/10 backdrop-blur-md transition-colors duration-200 hover:bg-white/[0.12] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Module 5: cinematic dark slider. Every slide sits in the same grid cell, so
 * the slider is as tall as its tallest slide (content-driven, no fixed height)
 * and switching slides never shifts the page. The first slide's title is the
 * page's <h1>.
 *
 * The slides cross-fade in place rather than slide, so nothing moves sideways
 * in Arabic either: only the controls mirror (previous at the start, its
 * chevron pointing that way).
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const t = useMessages(homeMessages);

  // Autoplay, unless paused (hover/focus), the tab is hidden, or motion is reduced.
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;
  const go = (i: number) => setIndex((i + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.highlights}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
      className={HERO_FRAME}
    >
      <HeroBackdrop />

      {/* Every slide fills the stack, held to the frame's width and stretched
          to the tallest slide's height. A positioned slide is a 16:9 stage, and
          an aspect ratio left to itself does neither: next to a taller slide it
          either took its width from that height and ran past the frame, or kept
          its own height and left a black band under its photo — both whenever
          the slider is narrower than ≈952px (two thirds of the row, beside the
          promo boxes). */}
      <div
        className="grid grid-cols-[minmax(0,1fr)] [grid-template-areas:'stack'] [&>*]:min-w-0 [&>*]:self-stretch [&>*]:justify-self-stretch"
        aria-live={paused ? "polite" : "off"}
      >
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <HeroSlideView
              key={slide.id}
              slide={slide}
              heading={i === 0 ? "h1" : "h2"}
              preloadImage={i === 0}
              wrapperProps={{
                role: "group",
                "aria-roledescription": "slide",
                "aria-label": `${i + 1} / ${count}`,
                inert: !active,
              }}
              className={`transition-opacity duration-700 ease-out [grid-area:stack] ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            />
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4">
          <button type="button" onClick={() => go(index - 1)} aria-label={t.hero.previous} className={controlClass}>
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={t.hero.slide(i + 1, slide.eyebrow)}
                aria-current={i === index ? "true" : undefined}
                className="group flex h-6 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span
                  className={`block h-1 rounded-full transition-[width,background-color] duration-300 ${
                    i === index ? "w-8 bg-white" : "w-4 bg-white/30 group-hover:bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(index + 1)} aria-label={t.hero.next} className={controlClass}>
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
