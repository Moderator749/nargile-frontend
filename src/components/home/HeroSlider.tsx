"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { LinkButton } from "@/components/ui/LinkButton";
import { canOptimiseImage, type HeroSlide } from "@/lib/home";
import type { HeroTextAlign } from "@/types";

const AUTOPLAY_MS = 7000;

/** Where a slide's text block and buttons sit, as set in /admin/hero. */
const ALIGN: Record<HeroTextAlign, { block: string; actions: string }> = {
  left: { block: "items-start text-left", actions: "items-start sm:justify-start" },
  center: { block: "items-center text-center", actions: "items-center sm:justify-center" },
  right: { block: "items-end text-right", actions: "items-end sm:justify-end" },
};

const controlClass =
  "flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300 ring-1 ring-inset ring-white/10 backdrop-blur-md transition-colors duration-200 hover:bg-white/[0.12] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Module 5: cinematic dark slider. Every slide sits in the same grid cell, so
 * the slider is as tall as its tallest slide (content-driven, no fixed height)
 * and switching slides never shifts the page. The first slide's title is the
 * page's <h1>.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

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
      aria-label="Öne çıkanlar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
      className="dark relative isolate overflow-hidden rounded-[2rem] bg-black text-foreground"
    >
      {/* Spotlight from above and a faint crimson glow below; shared by all slides. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[-40%] -z-10 h-full w-[130%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgb(63_63_70/0.55),rgb(24_24_27/0.3)_40%,transparent_70%)] motion-safe:animate-[spotlight_14s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[radial-gradient(60%_80%_at_50%_100%,rgb(200_16_46/0.16),transparent_70%)]"
      />

      <div className="grid [grid-template-areas:'stack']" aria-live={paused ? "polite" : "off"}>
        {slides.map((slide, i) => {
          const active = i === index;
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              inert={!active}
              className={`relative isolate flex flex-col justify-center px-6 pb-24 pt-20 transition-opacity duration-700 ease-out [grid-area:stack] sm:px-12 sm:pb-28 sm:pt-24 ${ALIGN[slide.align].block} ${
                active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {slide.image && (
                <>
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    preload={i === 0}
                    unoptimized={!canOptimiseImage(slide.image)}
                    sizes="(min-width: 1280px) 1024px, 100vw"
                    className="-z-20 object-cover"
                    // The admin's crop: the focal point stays put as the zoom
                    // pushes in on it.
                    style={{
                      objectPosition: `${slide.focus.x}% ${slide.focus.y}%`,
                      transform: slide.zoom > 100 ? `scale(${slide.zoom / 100})` : undefined,
                      transformOrigin: `${slide.focus.x}% ${slide.focus.y}%`,
                    }}
                  />
                  {/* A light wash keeps white text legible while the photo stays vivid; the
                      bottom fade only darkens behind the slide controls. */}
                  <div aria-hidden className="absolute inset-0 -z-10 bg-black/35" />
                  <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
                </>
              )}
              <p
                className={`text-[11px] font-medium uppercase tracking-[0.35em] ${slide.image ? "text-white/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]" : "text-zinc-500"}`}
              >
                {slide.eyebrow}
              </p>
              <Heading className={`mt-5 max-w-4xl ${slide.image ? "[text-shadow:0_2px_24px_rgb(0_0_0/0.45)]" : ""}`}>
                {/* Over a photo the title is solid white: the silver gradient would fade into it. */}
                <span
                  className={`block text-balance pb-2 text-4xl font-semibold leading-[1.04] tracking-tighter sm:text-6xl lg:text-7xl ${
                    slide.image ? "text-white" : "bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
                  }`}
                >
                  {slide.title}
                </span>
                <span
                  className={`mt-5 block text-balance text-base font-light tracking-tight sm:text-lg ${slide.image ? "text-white/85" : "text-zinc-400"}`}
                >
                  {slide.subtitle}
                </span>
              </Heading>
              <div className={`mt-10 flex flex-col gap-3 sm:flex-row ${ALIGN[slide.align].actions}`}>
                <LinkButton href={slide.cta.href} variant="primary">
                  {slide.cta.label}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </LinkButton>
                {slide.guestCta && (
                  <LinkButton href={slide.guestCta.href} variant="glass" className="guest-only">
                    {slide.guestCta.label}
                  </LinkButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4">
          <button type="button" onClick={() => go(index - 1)} aria-label="Önceki slayt" className={controlClass}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Slayt ${i + 1}: ${slide.eyebrow}`}
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
          <button type="button" onClick={() => go(index + 1)} aria-label="Sonraki slayt" className={controlClass}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
