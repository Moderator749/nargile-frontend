"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { DIRECTION } from "@/lib/i18n/config";
import { productMessages } from "@/lib/i18n/messages/product";

/** How far a tap zooms in, and how far a pinch or the wheel may go. */
const TAP_ZOOM = 2.5;
const MAX_ZOOM = 4;
/** A press that moves less than this is a tap; a swipe must travel this far to change photo. */
const TAP_SLOP = 6;
const SWIPE = 60;

/** The photo's scale and its offset from the centre, in pixels. */
interface View {
  scale: number;
  x: number;
  y: number;
}
const REST: View = { scale: 1, x: 0, y: 0 };

// Dark glass: it has to read over the dark backdrop and over a photo shot on
// white alike (a pale control vanishes against the white edge of a zoomed photo).
const control =
  "flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white shadow-lg shadow-black/30 ring-1 ring-inset ring-white/20 backdrop-blur transition-colors duration-200 hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-30";

/**
 * The product's photos full screen ("Görseli büyüt"), over a dark, blurred
 * backdrop: the photo at full resolution, the counter, zoom buttons and ✕ on
 * top, the arrows at its sides, the thumbnails underneath.
 *
 * Zoom: a click or a tap on the photo zooms in 2.5× on that very spot, and
 * again comes back out; a pinch (on a phone) or the wheel zooms smoothly, up
 * to 4×, around the fingers or the pointer. Zoomed in, the photo is dragged
 * about, never further than its own edges. At rest a sideways swipe changes
 * photo. A tap beside the photo, ✕ or Esc closes; ← → change photo, + − zoom.
 * In Arabic the photos run right to left, as the page reads: the next one is
 * to the left — the left arrow key, a swipe to the right.
 *
 * A native <dialog>, as the category drawer: the focus stays inside and the
 * page behind is inert; the page does not scroll under it either. Mounted
 * only while open, so a product page carries none of it until it is used.
 */
export function ProductLightbox({
  images,
  alt,
  start,
  onClose,
}: {
  images: string[];
  /** The product's name, for the photos' alt text. */
  alt: string;
  /** The photo it opens on. */
  start: number;
  /** With the photo it was on when it closed, for the gallery to follow. */
  onClose: (index: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(start);
  const [view, setView] = useState<View>(REST);
  // While a finger or the mouse moves the photo, it follows without easing.
  const [moving, setMoving] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const pinch = useRef<{ distance: number; view: View; mid: { x: number; y: number } } | null>(null);
  const count = images.length;
  const close = () => onClose(index);
  const t = useMessages(productMessages).gallery;
  /** +1 left to right, −1 in Arabic: which way "next" is on screen. */
  const forward = DIRECTION[useLocale()] === "rtl" ? -1 : 1;

  useEffect(() => {
    dialog.current?.showModal();
    // The way out first: the dialog would focus its first control, "Uzaklaştır" or "Yakınlaştır".
    closeButton.current?.focus();
    // The page stays where it was underneath.
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, []);

  const go = (next: number) => {
    setIndex((next + count) % count);
    setView(REST);
  };

  /** The stage's size and the photo's size within it (object-contain), in pixels. */
  function measure() {
    const box = stage.current?.getBoundingClientRect();
    const img = photo.current;
    if (!box) return null;
    const natural = img && img.naturalWidth > 0 ? img.naturalWidth / img.naturalHeight : 1;
    const fit = box.width / box.height > natural ? { w: box.height * natural, h: box.height } : { w: box.width, h: box.width / natural };
    return { box, fit };
  }

  /** Never further than the photo's own edges: at rest, centred. */
  function clamp(next: View): View {
    const m = measure();
    const scale = Math.min(MAX_ZOOM, Math.max(1, next.scale));
    if (!m || scale === 1) return { scale, x: 0, y: 0 };
    const maxX = Math.max(0, (m.fit.w * scale - m.box.width) / 2);
    const maxY = Math.max(0, (m.fit.h * scale - m.box.height) / 2);
    return { scale, x: Math.min(maxX, Math.max(-maxX, next.x)), y: Math.min(maxY, Math.max(-maxY, next.y)) };
  }

  /** A point on the screen as an offset from the stage's centre. */
  function fromCentre(clientX: number, clientY: number) {
    const box = stage.current!.getBoundingClientRect();
    return { x: clientX - box.left - box.width / 2, y: clientY - box.top - box.height / 2 };
  }

  /** Zoom to `scale`, keeping the photo's point under `at` (from the centre) where it is. */
  function zoomAt(scale: number, at: { x: number; y: number }, from: View = view) {
    const ratio = scale / from.scale;
    return clamp({ scale, x: at.x - (at.x - from.x) * ratio, y: at.y - (at.y - from.y) * ratio });
  }

  /** On the photo itself, not the empty stage around it. */
  function onPhoto(at: { x: number; y: number }) {
    const m = measure();
    if (!m) return false;
    return Math.abs(at.x - view.x) <= (m.fit.w * view.scale) / 2 && Math.abs(at.y - view.y) <= (m.fit.h * view.scale) / 2;
  }

  // The wheel zooms around the pointer. Not passive, so the page cannot take it.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const at = fromCentre(event.clientX, event.clientY);
      setView((current) => zoomAt(current.scale * Math.exp(-event.deltaY * 0.0015), at, current));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  });

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) press.current = { x: event.clientX, y: event.clientY, moved: false };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        view,
        mid: fromCentre((a.x + b.x) / 2, (a.y + b.y) / 2),
      };
      if (press.current) press.current.moved = true; // two fingers are never a tap
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const last = pointers.current.get(event.pointerId);
    if (!last) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (press.current && Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > TAP_SLOP) {
      press.current.moved = true;
    }

    if (pointers.current.size === 2 && pinch.current) {
      // Pinch: the scale follows the fingers' spread, around their midpoint.
      const [a, b] = [...pointers.current.values()];
      const start = pinch.current;
      const mid = fromCentre((a.x + b.x) / 2, (a.y + b.y) / 2);
      const scale = start.view.scale * (Math.hypot(a.x - b.x, a.y - b.y) / start.distance);
      const ratio = Math.min(MAX_ZOOM, Math.max(1, scale)) / start.view.scale;
      setMoving(true);
      setView(clamp({ scale, x: mid.x - (start.mid.x - start.view.x) * ratio, y: mid.y - (start.mid.y - start.view.y) * ratio }));
    } else if (pointers.current.size === 1 && view.scale > 1 && press.current?.moved) {
      // Zoomed in: the photo follows the finger or the mouse.
      setMoving(true);
      setView((current) => clamp({ ...current, x: current.x + event.clientX - last.x, y: current.y + event.clientY - last.y }));
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size > 0) return;
    setMoving(false);
    const started = press.current;
    press.current = null;
    if (!started) return;

    if (!started.moved) {
      // A tap: in or out on the photo; beside it, as on a backdrop, close.
      const at = fromCentre(event.clientX, event.clientY);
      if (view.scale > 1) setView(REST);
      else if (onPhoto(at)) setView(zoomAt(TAP_ZOOM, at));
      else close();
      return;
    }
    // At rest, a sideways swipe is the next or the previous photo: pulling
    // the next one in from the reading direction's end.
    const dx = event.clientX - started.x;
    if (view.scale === 1 && count > 1 && Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(event.clientY - started.y)) {
      go(index + (dx * forward < 0 ? 1 : -1));
    }
  }

  const zoomBy = (factor: number) => setView((current) => zoomAt(current.scale * factor, { x: 0, y: 0 }, current));

  return (
    <dialog
      ref={dialog}
      aria-label={t.viewer(alt, index + 1, count)}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        // The arrow keys follow the screen: ← is the previous photo left to
        // right, the next one in Arabic.
        if (event.key === "ArrowLeft" && count > 1) go(index - forward);
        else if (event.key === "ArrowRight" && count > 1) go(index + forward);
        else if (event.key === "+" || event.key === "=") zoomBy(1.5);
        else if (event.key === "-") zoomBy(1 / 1.5);
        else return;
        event.preventDefault();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white backdrop:bg-black/85 backdrop:backdrop-blur-sm motion-safe:backdrop:animate-[scrim-in_200ms_ease-out]"
    >
      <div className="flex h-full flex-col motion-safe:animate-[popup-in_220ms_ease-out]">
        {/* Top: where we are, the zoom, the way out. */}
        <div className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <p className="font-mono text-sm tabular-nums text-white/80" aria-live="polite">
            {index + 1} / {count}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => zoomBy(1 / 1.5)} disabled={view.scale <= 1} aria-label={t.zoomOut} className={control}>
              <ZoomOut className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => zoomBy(1.5)} disabled={view.scale >= MAX_ZOOM} aria-label={t.zoomIn} className={control}>
              <ZoomIn className="h-5 w-5" aria-hidden />
            </button>
            <button ref={closeButton} type="button" onClick={close} aria-label={t.close} className={`${control} ms-2`}>
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        {/* The stage: the photo, and every gesture on it. */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={stage}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`absolute inset-0 touch-none select-none overflow-hidden ${
              view.scale > 1 ? (moving ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
            }`}
          >
            <div
              className={`absolute inset-4 sm:inset-8 ${moving ? "" : "transition-transform duration-300 ease-out motion-reduce:transition-none"}`}
              style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}
            >
              <Image
                key={images[index]}
                ref={photo}
                src={images[index]}
                alt={t.nth(alt, index + 1)}
                fill
                // Full width at the screen's density: the sharpest copy there
                // is for a zoom, and never more than the original.
                sizes="100vw"
                draggable={false}
                className="pointer-events-none object-contain"
                onLoad={() => setView(REST)}
              />
            </div>
          </div>

          {/* The arrows from `sm`; on a phone the swipe and the thumbnails do it,
              and the arrows would sit on the photo's edges. */}
          {count > 1 && (
            <>
              <button type="button" onClick={() => go(index - 1)} aria-label={t.previous} className={`${control} absolute start-3 top-1/2 -translate-y-1/2 max-sm:hidden sm:start-6`}>
                <ChevronLeft className="h-6 w-6 rtl:rotate-180" aria-hidden />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label={t.next} className={`${control} absolute end-3 top-1/2 -translate-y-1/2 max-sm:hidden sm:end-6`}>
                <ChevronRight className="h-6 w-6 rtl:rotate-180" aria-hidden />
              </button>
            </>
          )}
        </div>

        {/* Bottom: every photo, the one shown ringed. */}
        {count > 1 && (
          <ul className="flex justify-center gap-2 overflow-x-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] [scrollbar-width:none]" aria-label={t.images}>
            {images.map((src, i) => (
              <li key={src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index}
                  className={`relative block h-14 w-14 overflow-hidden rounded-lg bg-white transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    i === index ? "ring-2 ring-white" : "opacity-50 hover:opacity-90"
                  }`}
                >
                  <Image src={src} alt={t.nth(alt, i + 1)} fill sizes="56px" className="object-contain p-1" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}
