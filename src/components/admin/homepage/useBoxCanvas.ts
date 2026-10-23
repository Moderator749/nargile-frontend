"use client";

import { useRef, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

import { useDragLayout } from "@/components/admin/useDragLayout";
import { BOX_DEFAULT_PX, BOX_TEXTS } from "@/components/home/BentoBoxView";
import type { HomeBentoBox, HomeBoxText } from "@/types";

const MIN_PX = 8;
const MAX_PX = 160;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const LABEL = Object.fromEntries(BOX_TEXTS.map((t) => [t.part, t.label])) as Record<HomeBoxText, string>;

/** How far the photo reaches past the box, in px, on each axis: what one full sweep of its focal point moves it by. */
function overflowOf(img: HTMLImageElement | null, box: DOMRect): { x: number; y: number } {
  if (!img?.naturalWidth || !img.naturalHeight) return { x: 0, y: 0 };
  const cover = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
  return { x: img.naturalWidth * cover - box.width, y: img.naturalHeight * cover - box.height };
}

/**
 * A "Görsel Vitrin" box's direct manipulation, as the hero slide's
 * (useHeroCanvas): drag a text to place it, drag a selected text's red corner
 * to size it, drag the photo to move its focal point.
 */
export function useBoxCanvas({
  box,
  set,
  frame,
}: {
  box: HomeBentoBox;
  set: (patch: Partial<HomeBentoBox>) => void;
  frame: RefObject<HTMLDivElement | null>;
}) {
  const { bind, selected, setSelected } = useDragLayout<HomeBoxText>({
    frame,
    parts: BOX_TEXTS.map((t) => t.part),
    layout: box.layout,
    setLayout: (layout) => set({ layout }),
    labels: LABEL,
  });

  // ── Drag a text's corner: its size follows the drag ───────────────────────
  const resizing = useRef<{ part: HomeBoxText; from: number; height: number; x: number; y: number } | null>(null);
  const pxOf = (part: HomeBoxText) => box.font_sizes?.[part] ?? BOX_DEFAULT_PX[part];
  const setPx = (part: HomeBoxText, px: number) =>
    set({ font_sizes: { ...(box.font_sizes ?? {}), [part]: Math.round(clamp(px, MIN_PX, MAX_PX)) } });

  /**
   * A placed text grown past the box's edge comes back inside it, centre and
   * all, as a drag would keep it: run when a resize ends.
   */
  const fitInside = (part: HomeBoxText) => {
    const layout = box.layout;
    const el = frame.current?.querySelector<HTMLElement>(`[data-part="${part}"]`);
    if (!layout || !el || !frame.current) return;
    const f = frame.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const half = { x: Math.min(50, (r.width / f.width) * 50), y: Math.min(50, (r.height / f.height) * 50) };
    const x = Math.round(clamp(layout[part].x, half.x, 100 - half.x) * 10) / 10;
    const y = Math.round(clamp(layout[part].y, half.y, 100 - half.y) * 10) / 10;
    if (x !== layout[part].x || y !== layout[part].y) set({ layout: { ...layout, [part]: { x, y } } });
  };

  const resize = (part: HomeBoxText): HTMLAttributes<HTMLElement> => ({
    role: "slider",
    tabIndex: 0,
    "aria-label": `${LABEL[part]} boyutu — köşeden sürükleyin ya da oklarla değiştirin`,
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
      // Down and outward grows it: the text's height scales with its size, so the drag's distance is the ratio.
      const outward = (e.clientX - r.x) * (getComputedStyle(e.currentTarget).direction === "rtl" ? -1 : 1);
      const grow = (outward + (e.clientY - r.y)) / 2;
      setPx(r.part, (r.from * (r.height + grow)) / r.height);
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const r = resizing.current;
      resizing.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      if (r) fitInside(r.part);
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      e.stopPropagation(); // not the text's own arrow-key move
      setPx(part, pxOf(part) + step * (e.shiftKey ? 4 : 1));
    },
    // After the keys' last change has drawn: back inside if it grew out.
    onKeyUp: () => fitInside(part),
  });

  // ── Drag the photo: its focal point follows ───────────────────────────────
  const panning = useRef<{ x: number; y: number; from: { x: number; y: number }; reach: { x: number; y: number } } | null>(null);
  const pan: HTMLAttributes<HTMLDivElement> = {
    onPointerDown: (e) => {
      // A text or a handle has its own drag; the photo is everything else.
      if (e.button !== 0 || (e.target as HTMLElement).closest("[data-part],[data-resize]")) return;
      e.preventDefault();
      panning.current = {
        x: e.clientX,
        y: e.clientY,
        from: { x: box.focus_x, y: box.focus_y },
        reach: overflowOf(e.currentTarget.querySelector("img"), e.currentTarget.getBoundingClientRect()),
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
      set({ focus_x: along(e.clientX - p.x, p.reach.x, p.from.x), focus_y: along(e.clientY - p.y, p.reach.y, p.from.y) });
    },
    onPointerUp: (e) => {
      panning.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    },
  };
  pan.onPointerCancel = pan.onPointerUp;

  return { bind, selected, resize, pan };
}
