"use client";

import { useRef, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

import { useDragLayout } from "@/components/admin/useDragLayout";
import { HERO_DEFAULT_PX, HERO_MOBILE_DEFAULT_PX, heroTextPx } from "@/components/home/HeroSlideView";
import type { HeroSlide } from "@/lib/home";
import type { HeroBgPosition, HeroPart, HeroSlideWrite } from "@/types";

/** Which design the canvas edits: the wide screen's, or a phone's own (below 768px). */
export type HeroDevice = "desktop" | "mobile";

export type SlideText = "eyebrow" | "title" | "subtitle";

export const HERO_PARTS: { part: HeroPart; label: string }[] = [
  { part: "eyebrow", label: "Üst etiket" },
  { part: "title", label: "Başlık" },
  { part: "subtitle", label: "Alt metin" },
  { part: "button", label: "Buton" },
];

const TEXT_LABEL: Record<SlideText, string> = { eyebrow: "Üst etiket", title: "Başlık", subtitle: "Alt metin" };
const MIN_PX = 8;
const MAX_PX = 160;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * A phone's crop as the storefront shows it: its own, else what a phone has
 * always shown — the portrait photo whole and centred, or the wide one
 * cropped as on the wide screen.
 */
export function mobileBg(v: HeroSlideWrite, hasMobileImage: boolean): HeroBgPosition {
  return (
    v.mobile_bg_position ??
    (hasMobileImage ? { x: 50, y: 50, zoom: 100 } : { x: v.image_focus_x, y: v.image_focus_y, zoom: v.image_zoom })
  );
}

/** The form as the storefront's slide, so a canvas renders exactly what will ship. */
export function previewSlide(v: HeroSlideWrite, image: string | null, mobileImage: string | null = null): HeroSlide {
  return {
    id: "preview",
    // As the storefront: an empty text is not there, so there is nothing of it to drag.
    eyebrow: v.eyebrow,
    title: v.title,
    subtitle: v.subtitle,
    // As the storefront: no button text, no button.
    cta: v.cta_label.trim() ? { label: v.cta_label, href: v.cta_href || "/" } : undefined,
    guestCta: v.guest_cta_label && v.guest_cta_href ? { label: v.guest_cta_label, href: v.guest_cta_href } : undefined,
    image: image || null,
    mobileImage: image ? mobileImage : null,
    align: v.text_align,
    focus: { x: v.image_focus_x, y: v.image_focus_y },
    zoom: v.image_zoom,
    layout: v.layout,
    overlay: v.enable_overlay,
    sizes: v.font_sizes,
    colors: v.text_colors,
    mobile: { layout: v.mobile_layout, sizes: v.mobile_font_sizes, bg: v.mobile_bg_position },
  };
}

/** The parts a slide has: an empty text, or no button, is not on it. */
export function presentParts(v: HeroSlideWrite): Record<HeroPart, boolean> {
  return {
    eyebrow: !!v.eyebrow.trim(),
    title: !!v.title.trim(),
    subtitle: !!v.subtitle.trim(),
    button: !!v.cta_label.trim() || (!!v.guest_cta_label?.trim() && !!v.guest_cta_href?.trim()),
  };
}

/**
 * How far the photo reaches past the stage, in px, on each axis: what one
 * full sweep of its focal point (0 → 100 %) moves it by. Object-fit cover
 * fills the stage on one axis and overflows on the other; the zoom adds to both.
 */
function overflowOf(img: HTMLImageElement | null, stage: DOMRect, zoom: number): { x: number; y: number } {
  if (!img?.naturalWidth || !img.naturalHeight) return { x: 0, y: 0 };
  const cover = Math.max(stage.width / img.naturalWidth, stage.height / img.naturalHeight);
  const z = zoom / 100;
  return { x: img.naturalWidth * cover * z - stage.width, y: img.naturalHeight * cover * z - stage.height };
}

/**
 * The canvas's direct manipulation, for one device's design: drag a part to
 * place it, drag a selected text's corner to size it, drag the photo to move
 * its focal point. Each writes only that device's fields — the wide screen's
 * `layout`, `font_sizes`, `image_focus_*`, or a phone's `mobile_layout`,
 * `mobile_font_sizes`, `mobile_bg_position` — so one never moves the other.
 */
export function useHeroCanvas({
  v,
  set,
  image,
  hasMobileImage,
  device,
  frame,
}: {
  v: HeroSlideWrite;
  set: (patch: Partial<HeroSlideWrite>) => void;
  image: string | null;
  hasMobileImage: boolean;
  device: HeroDevice;
  frame: RefObject<HTMLDivElement | null>;
}) {
  const mobile = device === "mobile";
  const { bind, selected, setSelected } = useDragLayout<HeroPart>({
    frame,
    parts: HERO_PARTS.map((p) => p.part),
    layout: mobile ? v.mobile_layout : v.layout,
    setLayout: (layout) => set(mobile ? { mobile_layout: layout } : { layout }),
    labels: Object.fromEntries(HERO_PARTS.map((p) => [p.part, p.label])) as Record<HeroPart, string>,
  });

  // ── Drag a text's corner: its size follows the drag ─────────────────────────
  const sizes = mobile ? v.mobile_font_sizes : v.font_sizes;
  const resizing = useRef<{ part: SlideText; from: number; height: number; x: number; y: number } | null>(null);
  const pxOf = (part: SlideText) => heroTextPx(sizes?.[part]) ?? (mobile ? HERO_MOBILE_DEFAULT_PX : HERO_DEFAULT_PX)[part];
  const setPx = (part: SlideText, px: number) => {
    const next = { ...(sizes ?? {}), [part]: Math.round(clamp(px, MIN_PX, MAX_PX)) };
    set(mobile ? { mobile_font_sizes: next } : { font_sizes: next });
  };

  const resize = (part: SlideText): HTMLAttributes<HTMLElement> => ({
    role: "slider",
    tabIndex: 0,
    "aria-label": `${TEXT_LABEL[part]} boyutu${mobile ? " (mobil)" : ""} — köşeden sürükleyin ya da oklarla değiştirin`,
    "aria-valuemin": MIN_PX,
    "aria-valuemax": MAX_PX,
    "aria-valuenow": pxOf(part),
    "aria-valuetext": `${pxOf(part)} piksel`,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      // The handle sits on the text: the text's own drag (move) must not start.
      e.stopPropagation();
      e.preventDefault();
      const text = e.currentTarget.parentElement;
      resizing.current = { part, from: pxOf(part), height: text?.getBoundingClientRect().height || 1, x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const r = resizing.current;
      if (!r) return;
      // Down and outward grows it, up and inward shrinks it: the text's
      // height scales with its size, so the drag's distance is the ratio.
      const outward = (e.clientX - r.x) * (getComputedStyle(e.currentTarget).direction === "rtl" ? -1 : 1);
      const grow = (outward + (e.clientY - r.y)) / 2;
      setPx(r.part, (r.from * (r.height + grow)) / r.height);
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      resizing.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      e.stopPropagation(); // not the text's own arrow-key move
      setPx(part, pxOf(part) + step * (e.shiftKey ? 4 : 1));
    },
  });

  // ── Drag the photo: its focal point follows ─────────────────────────────────
  const bg = mobile ? mobileBg(v, hasMobileImage) : { x: v.image_focus_x, y: v.image_focus_y, zoom: v.image_zoom };
  const panning = useRef<{ x: number; y: number; from: HeroBgPosition; reach: { x: number; y: number } } | null>(null);
  const pan: HTMLAttributes<HTMLDivElement> = {
    onPointerDown: (e) => {
      // A text, a button or a handle has its own drag; the photo is everything else.
      if (!image || e.button !== 0 || (e.target as HTMLElement).closest("[data-part],[data-resize]")) return;
      e.preventDefault();
      panning.current = {
        x: e.clientX,
        y: e.clientY,
        from: bg,
        reach: overflowOf(e.currentTarget.querySelector("img"), e.currentTarget.getBoundingClientRect(), bg.zoom),
      };
      setSelected(null);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e) => {
      const p = panning.current;
      if (!p) return;
      // Dragging the photo right shows more of its left: the focal point moves the other way.
      const along = (moved: number, reach: number, from: number) =>
        reach > 1 ? Math.round(clamp(from - (moved / reach) * 100, 0, 100)) : from;
      const x = along(e.clientX - p.x, p.reach.x, p.from.x);
      const y = along(e.clientY - p.y, p.reach.y, p.from.y);
      set(mobile ? { mobile_bg_position: { ...p.from, x, y } } : { image_focus_x: x, image_focus_y: y });
    },
    onPointerUp: (e) => {
      panning.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    },
  };
  pan.onPointerCancel = pan.onPointerUp;

  return { bind, selected, setSelected, resize, pan, bg };
}
