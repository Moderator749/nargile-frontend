import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { LinkButton, linkButtonClass } from "@/components/ui/LinkButton";
import { canOptimiseImage, type HeroSlide } from "@/lib/home";
import type { HeroPart, HeroTextAlign } from "@/types";

/**
 * One hero slide, as the storefront shows it and as the admin edits it — the
 * same markup in both places, so what is placed in /admin/hero is what the
 * homepage shows.
 *
 * Two layouts:
 * - The centred stack (no `layout`): the parts flow down the middle, and the
 *   slide is as tall as its content.
 * - Free positions (`layout` set), from `lg` up: the slide is a 16:9 stage and
 *   each part is centred on its own x/y (in % of the stage). Every size on the
 *   stage — type, spacing, the button — is a fraction of the stage's width
 *   (`cqw`), taken from the live slider at its widest (≈952px), so the stage
 *   is a scale model of itself at any width: the admin's smaller preview wraps
 *   lines and lands parts exactly where the homepage does. Below `lg` the
 *   stage would make the type too small to read, so a positioned slide falls
 *   back to the centred stack there.
 */

const ALIGN: Record<HeroTextAlign, { block: string; actions: string }> = {
  left: { block: "items-start text-left", actions: "items-start sm:justify-start" },
  center: { block: "items-center text-center", actions: "items-center sm:justify-center" },
  right: { block: "items-end text-right", actions: "items-end sm:justify-end" },
};

/** A part placed on the stage: centred on its point, as wide as its content. */
const PLACED = "lg:absolute lg:left-(--x) lg:top-(--y) lg:m-0 lg:w-max lg:-translate-x-1/2 lg:-translate-y-1/2";

export interface HeroEditorBinding {
  /** Event handlers and a11y props that make a part draggable. */
  bind: (part: HeroPart) => HTMLAttributes<HTMLElement>;
  selected: HeroPart | null;
}

export function HeroSlideView({
  slide,
  heading,
  preloadImage = false,
  className = "",
  wrapperProps,
  editor,
  children,
}: {
  slide: HeroSlide;
  /** The title's element: h1 for the first slide, h2 after; a div in the editor. */
  heading: "h1" | "h2" | "div";
  preloadImage?: boolean;
  className?: string;
  wrapperProps?: HTMLAttributes<HTMLDivElement>;
  /** Present in /admin/hero: parts become draggable and buttons stop being links. */
  editor?: HeroEditorBinding;
  /** Extra layers on the stage (the editor's guides). */
  children?: ReactNode;
}) {
  const placed = slide.layout !== null;
  const Heading = heading;
  const at = (part: HeroPart): CSSProperties | undefined =>
    slide.layout ? ({ "--x": `${slide.layout[part].x}%`, "--y": `${slide.layout[part].y}%` } as CSSProperties) : undefined;

  /** The positioning, the editor's handles, and a part's own classes, together. */
  const part = (name: HeroPart, own: string) => {
    const bound = editor?.bind(name) ?? {};
    const editing = editor
      ? `cursor-grab touch-none select-none outline-dashed outline-1 outline-offset-4 active:cursor-grabbing ${
          editor.selected === name ? "outline-2 outline-red-500" : "outline-white/40 hover:outline-white/80"
        }`
      : "";
    return { ...bound, "data-part": name, style: at(name), className: `${placed ? PLACED : ""} ${own} ${editing}` };
  };

  const textShadow = slide.image ? "[text-shadow:0_2px_24px_rgb(0_0_0/0.45)]" : "";

  return (
    <div
      {...wrapperProps}
      className={`@container relative isolate flex flex-col justify-center px-6 pb-24 pt-20 sm:px-12 sm:pb-28 sm:pt-24 ${ALIGN[slide.align].block} ${
        placed ? "lg:block lg:aspect-video lg:p-0" : ""
      } ${className}`}
    >
      {slide.image && (
        <>
          <Image
            src={slide.image}
            alt=""
            fill
            preload={preloadImage}
            unoptimized={!canOptimiseImage(slide.image)}
            sizes="(min-width: 1280px) 1024px, 100vw"
            className="pointer-events-none -z-20 object-cover"
            // The admin's crop: the focal point stays put as the zoom pushes in on it.
            style={{
              objectPosition: `${slide.focus.x}% ${slide.focus.y}%`,
              transform: slide.zoom > 100 ? `scale(${slide.zoom / 100})` : undefined,
              transformOrigin: `${slide.focus.x}% ${slide.focus.y}%`,
            }}
          />
          {/* A light wash keeps white text legible while the photo stays vivid; the
              bottom fade only darkens behind the slide controls. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-black/35" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
        </>
      )}

      <p
        {...part(
          "eyebrow",
          `text-[11px] font-medium uppercase tracking-[0.35em] lg:max-w-[90cqw] ${placed ? "lg:text-[1.1555cqw]" : ""} ${
            slide.image ? "text-white/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]" : "text-zinc-500"
          }`,
        )}
      >
        {slide.eyebrow}
      </p>

      <Heading className={`mt-5 max-w-4xl ${placed ? "lg:contents" : ""} ${textShadow}`}>
        {/* Over a photo the title is solid white: the silver gradient would fade into it. */}
        <span
          {...part(
            "title",
            `block text-balance pb-2 text-4xl font-semibold leading-[1.04] tracking-tighter sm:text-6xl lg:text-7xl ${
              placed ? `lg:max-w-[90cqw] lg:pb-[0.84cqw] lg:text-[7.563cqw] ${textShadow}` : ""
            } ${slide.image ? "text-white" : "bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"}`,
          )}
        >
          {slide.title}
        </span>
        <span
          {...part(
            "subtitle",
            `mt-5 block text-balance text-base font-light tracking-tight sm:text-lg ${
              placed ? `lg:max-w-[70cqw] lg:text-[1.891cqw] lg:leading-[1.5556] ${textShadow}` : ""
            } ${slide.image ? "text-white/85" : "text-zinc-400"}`,
          )}
        >
          {slide.subtitle}
        </span>
      </Heading>

      <div
        {...part(
          "button",
          `mt-10 flex flex-col gap-3 sm:flex-row ${ALIGN[slide.align].actions} ${placed ? "lg:flex-row lg:gap-[1.26cqw]" : ""}`,
        )}
      >
        <HeroButton editor={!!editor} placed={placed} href={slide.cta.href} variant="primary">
          {slide.cta.label}
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 ${placed ? "lg:h-[1.681cqw] lg:w-[1.681cqw]" : ""}`}
            aria-hidden
          />
        </HeroButton>
        {slide.guestCta && (
          // A guest-only button: hidden once signed in on the storefront, but
          // always shown in the editor, since guests are who see it.
          <HeroButton editor={!!editor} placed={placed} href={slide.guestCta.href} variant="glass" className={editor ? "" : "guest-only"}>
            {slide.guestCta.label}
          </HeroButton>
        )}
      </div>

      {children}
    </div>
  );
}

/** The slide's button at stage scale; a plain span in the editor, so a drag never navigates. */
function HeroButton({
  editor,
  placed,
  href,
  variant,
  className = "",
  children,
}: {
  editor: boolean;
  placed: boolean;
  href: string;
  variant: "primary" | "glass";
  className?: string;
  children: ReactNode;
}) {
  const scaled = placed ? "lg:h-[5.042cqw] lg:gap-[0.84cqw] lg:px-[2.941cqw] lg:text-[1.471cqw] lg:leading-[1.43]" : "";
  if (editor) return <span className={`${linkButtonClass(variant)} pointer-events-none ${scaled} ${className}`}>{children}</span>;
  return (
    <LinkButton href={href} variant={variant} className={`${scaled} ${className}`}>
      {children}
    </LinkButton>
  );
}

/** The slider's shared backdrop: a spotlight from above and a faint crimson glow below. */
export function HeroBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="absolute left-1/2 top-[-40%] -z-10 h-full w-[130%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgb(63_63_70/0.55),rgb(24_24_27/0.3)_40%,transparent_70%)] motion-safe:animate-[spotlight_14s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[radial-gradient(60%_80%_at_50%_100%,rgb(200_16_46/0.16),transparent_70%)]"
      />
    </>
  );
}

/** The slider's outer frame, shared so the editor's stage has the same corners and backdrop. */
export const HERO_FRAME = "dark relative isolate overflow-hidden rounded-[2rem] bg-black text-foreground";
