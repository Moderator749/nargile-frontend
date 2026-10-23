import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { preload } from "react-dom";
import Image, { getImageProps } from "next/image";
import { ArrowRight } from "lucide-react";

import { LinkButton, linkButtonClass } from "@/components/ui/LinkButton";
import { canOptimiseImage, type HeroSlide } from "@/lib/home";
import type { HeroButtonSize, HeroFontSize, HeroPart, HeroTextAlign } from "@/types";
import { SITE_NAME } from "@/lib/site";

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

/**
 * The admin's alignment is a side of the photo, so it stays that side in
 * Arabic too: the words keep clear of the subject the photo was composed
 * around (and a part placed on the stage keeps its x). In a right-to-left
 * page a flex column's `start` is the right, hence the `rtl:` swaps.
 */
const ALIGN: Record<HeroTextAlign, { block: string; actions: string }> = {
  left: { block: "items-start text-left rtl:items-end", actions: "justify-start rtl:justify-end" },
  center: { block: "items-center text-center", actions: "justify-center" },
  right: { block: "items-end text-right rtl:items-start", actions: "justify-end rtl:justify-start" },
};

/**
 * The buttons' size, as "Ana Sayfa Düzenleme › Hero Slider" sets it: on a
 * phone (below `md`) and from a tablet up, each a size down ("sm"), the
 * shop's own ("md") or a size up ("lg"). On a stage of placed parts (from
 * `lg`) a button is a fraction of the stage like everything on it, the same
 * three steps as factors (0.85, 1, 1.2) of its own.
 */
const BUTTON_PHONE: Record<HeroButtonSize, { button: string; icon: string }> = {
  sm: { button: "max-md:h-9 max-md:gap-1.5 max-md:px-4 max-md:text-xs", icon: "max-md:h-3 max-md:w-3" },
  md: { button: "max-md:h-10 max-md:gap-1.5 max-md:px-5 max-md:text-[13px]", icon: "max-md:h-3.5 max-md:w-3.5" },
  lg: { button: "max-md:h-12 max-md:gap-2 max-md:px-7 max-md:text-sm", icon: "max-md:h-4 max-md:w-4" },
};
const BUTTON_WIDE: Record<HeroButtonSize, { button: string; icon: string }> = {
  sm: { button: "md:h-10 md:gap-1.5 md:px-5 md:text-[13px]", icon: "md:h-3.5 md:w-3.5" },
  md: { button: "md:h-12 md:gap-2 md:px-7 md:text-sm", icon: "md:h-4 md:w-4" },
  lg: { button: "md:h-14 md:gap-2.5 md:px-9 md:text-base", icon: "md:h-5 md:w-5" },
};
const BUTTON_STAGE: Record<HeroButtonSize, { button: string; icon: string }> = {
  sm: { button: "lg:h-[4.286cqw] lg:gap-[0.714cqw] lg:px-[2.5cqw] lg:text-[1.25cqw] lg:leading-[1.43]", icon: "lg:h-[1.429cqw] lg:w-[1.429cqw]" },
  md: { button: "lg:h-[5.042cqw] lg:gap-[0.84cqw] lg:px-[2.941cqw] lg:text-[1.471cqw] lg:leading-[1.43]", icon: "lg:h-[1.681cqw] lg:w-[1.681cqw]" },
  lg: { button: "lg:h-[6.05cqw] lg:gap-[1.008cqw] lg:px-[3.529cqw] lg:text-[1.765cqw] lg:leading-[1.43]", icon: "lg:h-[2.017cqw] lg:w-[2.017cqw]" },
};

/** A button's and its arrow's size classes for the slider's setting, on a stage of placed parts or not. */
function buttonSizing(size: HeroButtonSizes, placed: boolean) {
  const phone = BUTTON_PHONE[size.mobile];
  const wide = BUTTON_WIDE[size.desktop];
  const stage = placed ? BUTTON_STAGE[size.desktop] : null;
  return {
    button: `${phone.button} ${wide.button} ${stage?.button ?? ""}`,
    icon: `${phone.icon} ${wide.icon} ${stage?.icon ?? ""}`,
  };
}

/** The slider's button sizes: from a tablet up, and on a phone. */
export interface HeroButtonSizes {
  desktop: HeroButtonSize;
  mobile: HeroButtonSize;
}

/**
 * The same sizes without a screen prefix, for the panel's preview of each
 * (keep in step with BUTTON_PHONE and BUTTON_WIDE): what a phone and a wider
 * screen show.
 */
export const BUTTON_PREVIEW: Record<"mobile" | "desktop", Record<HeroButtonSize, string>> = {
  mobile: { sm: "h-9 gap-1.5 px-4 text-xs", md: "h-10 gap-1.5 px-5 text-[13px]", lg: "h-12 gap-2 px-7 text-sm" },
  desktop: { sm: "h-10 gap-1.5 px-5 text-[13px]", md: "h-12 gap-2 px-7 text-sm", lg: "h-14 gap-2.5 px-9 text-base" },
};

/** The shop's own size on both, until the admin picks another. */
export const DEFAULT_BUTTON_SIZES: HeroButtonSizes = { desktop: "md", mobile: "md" };

/** The wide photo's width on screen: the slider's, 1024px at most. */
const WIDE_SIZES = "(min-width: 1280px) 1024px, 100vw";

/** Where a slide's portrait photo gives way to its wide one: Tailwind's `md`. */
const WIDE_MEDIA = "(min-width: 768px)";
const NARROW_MEDIA = "(max-width: 767.98px)";

/**
 * A slide with a portrait photo for phones ("Mobil Yönetim"): one <img> in a
 * <picture> (art direction, `getImageProps`), so a phone downloads only the
 * portrait photo and a wider screen only the wide one — never both. The first
 * slide's two are preloaded, each for its own screens only. The admin's crop
 * (focus and zoom) was set on the wide photo, so it applies from `md`; the
 * portrait one is shown centred, as it was composed.
 */
function ArtDirectedImage({
  wide,
  tall,
  alt,
  crop,
  eager,
}: {
  wide: string;
  tall: string;
  alt: string;
  /** The crop's CSS variables: the wide screen's and the phone's (`cropVars`). */
  crop: CSSProperties;
  eager: boolean;
}) {
  const { props: wideProps } = getImageProps({ src: wide, alt, fill: true, sizes: WIDE_SIZES, unoptimized: !canOptimiseImage(wide) });
  const { props: tallProps } = getImageProps({ src: tall, alt, fill: true, sizes: "100vw", unoptimized: !canOptimiseImage(tall) });
  if (eager) {
    const high = { as: "image", fetchPriority: "high" } as const;
    preload(wideProps.src, { ...high, imageSrcSet: wideProps.srcSet, imageSizes: wideProps.sizes, media: WIDE_MEDIA });
    preload(tallProps.src, { ...high, imageSrcSet: tallProps.srcSet, imageSizes: tallProps.sizes, media: NARROW_MEDIA });
  }
  return (
    <picture>
      <source media={WIDE_MEDIA} srcSet={wideProps.srcSet ?? wideProps.src} sizes={wideProps.sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- the alt is in the props getImageProps returned */}
      <img
        {...tallProps}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className={`pointer-events-none -z-20 object-cover ${CROP}`}
        style={{ ...tallProps.style, ...crop }}
      />
    </picture>
  );
}

/** The named sizes of the editor's first version, as px on the widest slider (≈952px). */
export const HERO_FONT_PX: Record<HeroFontSize, number> = {
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
};
const WIDEST = 9.52; // px per cqw on the widest slider

/** Each text's own size on the widest slider, where the admin has set none: what a resize starts from. */
export const HERO_DEFAULT_PX = { eyebrow: 11, title: 72, subtitle: 18 } as const;

/** A stored size as px: a number as it is, a name of the first version as the px it stood for. */
export const heroTextPx = (size: number | string | null | undefined): number | null =>
  typeof size === "number" ? size : size ? (HERO_FONT_PX[size as HeroFontSize] ?? null) : null;

/**
 * A text the admin sized: its size on the widest slider, shrinking with the
 * slide (`cqw`) down to half of it (12px at least) on a phone. On a stage
 * with placed parts it is exactly the stage's fraction from `lg`, like
 * every other size there, so the admin's preview stays a scale model.
 */
function sized(size: number | string | null | undefined, placed: boolean): { className: string; style: CSSProperties } | null {
  const px = heroTextPx(size);
  if (!px) return null;
  return {
    className: `text-[length:clamp(var(--fs-min),var(--fs-cqw),var(--fs))] ${placed ? "lg:text-[length:var(--fs-cqw)]" : ""}`,
    style: {
      "--fs": `${px}px`,
      "--fs-cqw": `${(px / WIDEST).toFixed(4)}cqw`,
      // Never under half its size on a phone, nor under 12px — unless it is smaller still.
      "--fs-min": `${Math.min(px, Math.max(12, px / 2))}px`,
    } as CSSProperties,
  };
}

/** A part placed on the stage: centred on its point, as wide as its content. */
const PLACED = "lg:absolute lg:left-(--x) lg:top-(--y) lg:m-0 lg:w-max lg:-translate-x-1/2 lg:-translate-y-1/2";
/** The same on a phone's own stage (below `md`), at the phone's own point. */
const PLACED_MOBILE =
  "max-md:absolute max-md:left-(--mx) max-md:top-(--my) max-md:m-0 max-md:w-max max-md:max-w-[90cqw] max-md:-translate-x-1/2 max-md:-translate-y-1/2";

/**
 * The photo's crop: a phone's (`--mfocus`, `--mzoom`) below `md`, the wide
 * screen's from it — the focal point stays put as the zoom pushes in on it.
 */
const CROP = "origin-(--mfocus) object-(--mfocus) scale-(--mzoom) md:origin-(--focus) md:object-(--focus) md:scale-(--zoom)";

/** A phone's text sizes are px on a 375px-wide stage, scaling with the phone. */
const PHONE = 3.75; // px per cqw on a 375px stage

/** Each text's own size on a phone, where the admin has set none: what a mobile resize starts from. */
export const HERO_MOBILE_DEFAULT_PX = { eyebrow: 11, title: 36, subtitle: 16 } as const;

/** A text the admin sized for phones: its own size below `md`, whatever the wide screen's. */
function mobileSized(size: number | string | null | undefined): { className: string; style: CSSProperties } | null {
  const px = heroTextPx(size);
  if (!px) return null;
  return { className: "max-md:text-[length:var(--mfs)]", style: { "--mfs": `${(px / PHONE).toFixed(4)}cqw` } as CSSProperties };
}

/** The crop's variables for a slide: the wide screen's, and a phone's (its own, else what a phone always showed). */
function cropVars(slide: HeroSlide): CSSProperties {
  const bg = slide.mobile?.bg;
  // A portrait photo for phones was shown centred and whole; the wide one, cropped as on the wide screen.
  const phone = bg ?? (slide.mobileImage ? { x: 50, y: 50, zoom: 100 } : { ...slide.focus, zoom: slide.zoom });
  return {
    "--focus": `${slide.focus.x}% ${slide.focus.y}%`,
    "--zoom": slide.zoom / 100,
    "--mfocus": `${phone.x}% ${phone.y}%`,
    "--mzoom": phone.zoom / 100,
  } as CSSProperties;
}

export interface HeroEditorBinding {
  /** Event handlers and a11y props that make a part draggable. */
  bind: (part: HeroPart) => HTMLAttributes<HTMLElement>;
  selected: HeroPart | null;
  /** The corner handle that resizes a selected text, by dragging. */
  resize?: (part: "eyebrow" | "title" | "subtitle") => HTMLAttributes<HTMLElement>;
}

/** A selected text's resize handle in the editor: its bottom corner, at the text's trailing end. */
function ResizeHandle({ editor, part }: { editor?: HeroEditorBinding; part: "eyebrow" | "title" | "subtitle" }) {
  if (!editor?.resize || editor.selected !== part) return null;
  return (
    <span
      {...editor.resize(part)}
      data-resize={part}
      className="absolute -end-2 -bottom-2 z-10 h-4 w-4 cursor-nwse-resize touch-none rounded-sm border-2 border-white bg-red-500 shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rtl:cursor-nesw-resize"
    />
  );
}

export function HeroSlideView({
  slide,
  heading,
  preloadImage = false,
  className = "",
  wrapperProps,
  editor,
  buttonSize = DEFAULT_BUTTON_SIZES,
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
  /** The buttons' size ("Ana Sayfa Düzenleme › Hero Slider"). */
  buttonSize?: HeroButtonSizes;
  /** Extra layers on the stage (the editor's guides). */
  children?: ReactNode;
}) {
  const placed = slide.layout !== null;
  // A phone's own positions (below `md`): the slide becomes a 4:5 stage there.
  const mobileLayout = slide.mobile?.layout ?? null;
  const mplaced = mobileLayout !== null;
  const Heading = heading;
  const at = (part: HeroPart): CSSProperties =>
    ({
      ...(slide.layout ? { "--x": `${slide.layout[part].x}%`, "--y": `${slide.layout[part].y}%` } : {}),
      ...(mobileLayout ? { "--mx": `${mobileLayout[part].x}%`, "--my": `${mobileLayout[part].y}%` } : {}),
    }) as CSSProperties;

  /** The positioning, the editor's handles, and a part's own classes and style, together. */
  const part = (name: HeroPart, own: string, style?: CSSProperties) => {
    const bound = editor?.bind(name) ?? {};
    const editing = editor
      ? `relative cursor-grab touch-none select-none outline-dashed outline-1 outline-offset-4 active:cursor-grabbing ${
          editor.selected === name ? "outline-2 outline-red-500" : "outline-white/40 hover:outline-white/80"
        }`
      : "";
    return {
      ...bound,
      "data-part": name,
      style: { ...at(name), ...style },
      className: `${placed ? PLACED : ""} ${mplaced ? PLACED_MOBILE : ""} ${own} ${editing}`,
    };
  };

  const textShadow = slide.image ? "[text-shadow:0_2px_24px_rgb(0_0_0/0.45)]" : "";
  // The admin's size and colour per text, where set; the slide's own otherwise.
  const size = {
    eyebrow: sized(slide.sizes?.eyebrow, placed),
    title: sized(slide.sizes?.title, placed),
    subtitle: sized(slide.sizes?.subtitle, placed),
  };
  const msize = {
    eyebrow: mobileSized(slide.mobile?.sizes?.eyebrow),
    title: mobileSized(slide.mobile?.sizes?.title),
    subtitle: mobileSized(slide.mobile?.sizes?.subtitle),
  };
  const color = (text: "eyebrow" | "title" | "subtitle"): CSSProperties =>
    slide.colors?.[text] ? { color: slide.colors[text]! } : {};
  // Every text is optional: one left empty is not on the page at all (a
  // banner can carry its words in the photo). The title, when there is one,
  // is the heading; the subtitle without it is plain text.
  const has = { eyebrow: !!slide.eyebrow.trim(), title: !!slide.title.trim(), subtitle: !!slide.subtitle.trim() };
  const alt = has.title ? `${slide.title.replace(/\s*\n\s*/g, " ")} | ${SITE_NAME}` : SITE_NAME;
  const buttons = !!slide.cta || !!slide.guestCta;
  // No text and no button: the photo alone, as tall as a slide with words.
  const bare = !has.eyebrow && !has.title && !has.subtitle && !buttons;
  const TextBlock = has.title ? Heading : "div";
  const sizing = buttonSizing(buttonSize, placed);

  return (
    <div
      {...wrapperProps}
      className={`@container relative isolate flex flex-col justify-center ${
        // A phone's own positions make its slide a stage of its own, unpadded.
        mplaced ? "max-md:block md:px-12 md:pb-28 md:pt-24" : "px-6 pb-24 pt-20 sm:px-12 sm:pb-28 sm:pt-24"
      } ${ALIGN[slide.align].block} ${placed ? "lg:block lg:aspect-video lg:p-0" : ""} ${
        // A portrait photo for phones gets a portrait slide to show it in (and,
        // in the slider's stack, so do the slides beside it); so does a phone's own layout.
        mplaced || (slide.image && slide.mobileImage) ? "max-md:aspect-[4/5]" : ""
      } ${bare ? "min-h-[22rem] sm:min-h-[26rem] lg:min-h-[30rem]" : ""} ${className}`}
    >
      {slide.image && (
        <>
          {slide.mobileImage ? (
            <ArtDirectedImage
              wide={slide.image}
              tall={slide.mobileImage}
              alt={alt}
              crop={cropVars(slide)}
              eager={preloadImage}
            />
          ) : (
            <Image
              src={slide.image}
              // Named for search engines and image search; the visible title
              // overlaps it, which costs a screen reader one repeated phrase.
              alt={alt}
              fill
              preload={preloadImage}
              unoptimized={!canOptimiseImage(slide.image)}
              sizes={WIDE_SIZES}
              // The admin's crop, a phone's and the wide screen's.
              className={`pointer-events-none -z-20 object-cover ${CROP}`}
              style={cropVars(slide)}
            />
          )}
          {/* A light wash keeps white text legible while the photo stays vivid; the
              bottom fade only darkens behind the slide controls. Switched off by
              the admin, the photo shows as it is. */}
          {slide.overlay && (
            <>
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-black/30" />
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
            </>
          )}
        </>
      )}

      {has.eyebrow && (
        <p
          {...part(
            "eyebrow",
            `font-medium uppercase tracking-[0.35em] lg:max-w-[90cqw] ${
              size.eyebrow ? size.eyebrow.className : `text-[11px] ${placed ? "lg:text-[1.1555cqw]" : ""}`
            } ${msize.eyebrow?.className ?? ""} ${slide.image ? "text-white/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]" : "text-zinc-500"}`,
            { ...size.eyebrow?.style, ...msize.eyebrow?.style, ...color("eyebrow") },
          )}
        >
          {slide.eyebrow}
          <ResizeHandle editor={editor} part="eyebrow" />
        </p>
      )}

      {(has.title || has.subtitle) && (
        <TextBlock
          className={`${has.eyebrow ? "mt-5" : ""} max-w-4xl ${placed ? "lg:contents" : ""} ${mplaced ? "max-md:contents" : ""} ${textShadow}`}
        >
          {/* Over a photo the title is solid white: the silver gradient would fade
              into it. A colour the admin chose replaces either. Line breaks kept. */}
          {has.title && (
            <span
              {...part(
                "title",
                `block whitespace-pre-line text-balance pb-2 font-semibold leading-[1.04] tracking-tighter ${
                  size.title
                    ? size.title.className
                    : `${msize.title ? "md:text-6xl" : "text-4xl sm:text-6xl"} lg:text-7xl ${placed ? "lg:text-[7.563cqw]" : ""}`
                } ${msize.title?.className ?? ""} ${placed ? `lg:max-w-[90cqw] lg:pb-[0.84cqw] ${textShadow}` : ""} ${
                  slide.colors?.title
                    ? ""
                    : slide.image
                      ? "text-white"
                      : "bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
                }`,
                { ...size.title?.style, ...msize.title?.style, ...color("title") },
              )}
            >
              {slide.title}
              <ResizeHandle editor={editor} part="title" />
            </span>
          )}
          {has.subtitle && (
            <span
              {...part(
                "subtitle",
                `${has.title ? "mt-5" : ""} block whitespace-pre-line text-balance font-light tracking-tight ${
                  size.subtitle
                    ? size.subtitle.className
                    : `${msize.subtitle ? "md:text-lg" : "text-base sm:text-lg"} ${placed ? "lg:text-[1.891cqw]" : ""}`
                } ${msize.subtitle?.className ?? ""} ${placed ? `lg:max-w-[70cqw] lg:leading-[1.5556] ${textShadow}` : ""} ${slide.image ? "text-white/85" : "text-zinc-400"}`,
                { ...size.subtitle?.style, ...msize.subtitle?.style, ...color("subtitle") },
              )}
            >
              {slide.subtitle}
              <ResizeHandle editor={editor} part="subtitle" />
            </span>
          )}
        </TextBlock>
      )}

      {/* No button text, no button: the slide is words and a photo only. */}
      {buttons && (
        <div
          {...part(
            "button",
            `${has.eyebrow || has.title || has.subtitle ? "mt-8 md:mt-10" : ""} flex flex-row flex-wrap gap-2 md:gap-3 ${ALIGN[slide.align].actions} ${placed ? "lg:gap-[1.26cqw]" : ""}`,
          )}
        >
          {slide.cta && (
            <HeroButton editor={!!editor} sizing={sizing.button} href={slide.cta.href} variant="primary">
              {slide.cta.label}
              <ArrowRight
                className={`h-4 w-4 transition-transform duration-200 rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5 ${sizing.icon}`}
                aria-hidden
              />
            </HeroButton>
          )}
          {slide.guestCta && (
            // A guest-only button: hidden once signed in on the storefront, but
            // always shown in the editor, since guests are who see it.
            <HeroButton editor={!!editor} sizing={sizing.button} href={slide.guestCta.href} variant="glass" className={editor ? "" : "guest-only"}>
              {slide.guestCta.label}
            </HeroButton>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

/** The slide's button at the slider's size; a plain span in the editor, so a drag never navigates. */
function HeroButton({
  editor,
  sizing,
  href,
  variant,
  className = "",
  children,
}: {
  editor: boolean;
  /** buttonSizing's classes. */
  sizing: string;
  href: string;
  variant: "primary" | "glass";
  className?: string;
  children: ReactNode;
}) {
  if (editor) return <span className={`${linkButtonClass(variant)} pointer-events-none ${sizing} ${className}`}>{children}</span>;
  return (
    <LinkButton href={href} variant={variant} className={`${sizing} ${className}`}>
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
