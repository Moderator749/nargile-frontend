"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { HERO_FRAME, HeroBackdrop, HeroSlideView } from "@/components/home/HeroSlideView";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { homeMessages } from "@/lib/i18n/messages/home";
import type { HeroSlide } from "@/lib/home";
import { SITE_NAME } from "@/lib/site";

const AUTOPLAY_MS = 7000;

// 44px to the finger (40px on a phone, on a lighter glass), on a dark glass of
// their own: seen on a white marble slide as on a black one.
const controlClass =
  "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/45 max-md:h-10 max-md:w-10 max-md:bg-black/35 text-white ring-1 ring-inset ring-white/15 backdrop-blur-md transition-colors duration-200 hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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
  // The slides cross-fade in one box, so every photo is "in view" and
  // loading="lazy" holds none back: a phone fetched all of them with the
  // first, on the connection the first one (the page's LCP) needs. The others
  // join once the page has loaded — well before autoplay first moves on.
  const [warm, setWarm] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2) return;
    const start = () => setWarm(true);
    if (document.readyState === "complete") {
      start();
      return;
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, [count]);
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
              showImage={i === 0 || i === index || warm}
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

      {/* On a phone the arrows sit on the slider's sides, halfway down — in
          the 48px the slide keeps clear of its words at each side
          (HeroSlideView) — and the dots at its foot, under the slide's
          button; the group is dissolved there (`contents`) so each is placed
          on the slider itself. Centred under the slide from `md`, as before.
          Flipping a slide leaves an open category column open (`data-sidebar-keep`). */}
      {count > 1 && (
        <div data-sidebar-keep className="pointer-events-none max-md:contents md:absolute md:inset-x-0 md:bottom-5 md:flex md:items-center md:justify-center md:gap-4">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={t.hero.previous}
            className={`${controlClass} max-md:absolute max-md:start-1 max-md:top-1/2 max-md:-translate-y-1/2`}
          >
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
          </button>
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/35 px-2 backdrop-blur-md max-md:absolute max-md:bottom-2 max-md:left-1/2 max-md:-translate-x-1/2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                // Named by its eyebrow, else its title; a slide that is its photo alone, by the shop.
                aria-label={t.hero.slide(i + 1, slide.eyebrow.trim() || slide.title.replace(/\s+/g, " ").trim() || SITE_NAME)}
                aria-current={i === index ? "true" : undefined}
                // A 44px row to the finger (32px on a phone, at the slide's foot), each dot at least 24px wide.
                className="group flex h-11 items-center px-1 max-md:h-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span
                  className={`block h-1 rounded-full shadow-[0_0_0_1px_rgb(0_0_0/0.25)] transition-[width,background-color] duration-300 ${
                    i === index ? "w-8 bg-white" : "w-4 bg-white/45 group-hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label={t.hero.next}
            className={`${controlClass} max-md:absolute max-md:end-1 max-md:top-1/2 max-md:-translate-y-1/2`}
          >
            <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
