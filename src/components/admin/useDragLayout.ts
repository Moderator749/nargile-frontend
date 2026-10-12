"use client";

import { useRef, useState, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

type Point = { x: number; y: number };

const clamp = (n: number, min = 0, max = 100) => Math.round(Math.min(max, Math.max(min, n)) * 10) / 10;

/**
 * Drag-to-place for the parts of a preview (a hero slide, a promo card): each
 * part marked `data-part="<name>"` inside `frame` can be dragged, or nudged
 * with the arrow keys once focused (0.5% a press, 2% with Shift).
 *
 * Positions are each part's centre in % of the frame. A part never leaves the
 * frame: its centre stays at least half its own size from every edge. The
 * first drag out of the default (flow) layout starts from where the parts
 * actually are on screen, so nothing jumps.
 */
export function useDragLayout<P extends string>({
  frame,
  parts,
  layout,
  setLayout,
  labels,
}: {
  frame: RefObject<HTMLElement | null>;
  /** The parts present on this preview. */
  parts: readonly P[];
  layout: Record<P, Point> | null;
  setLayout: (layout: Record<P, Point>) => void;
  labels: Record<P, string>;
}) {
  const [selected, setSelected] = useState<P | null>(null);
  const drag = useRef<{ part: P; px: number; py: number; start: Record<P, Point>; rect: DOMRect } | null>(null);

  const element = (part: P) => frame.current?.querySelector<HTMLElement>(`[data-part="${part}"]`) ?? null;

  /** Half a part's size, in % of the frame. */
  function halfOf(part: P): Point {
    const box = frame.current!.getBoundingClientRect();
    const r = element(part)?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: Math.min(50, (r.width / box.width) * 50), y: Math.min(50, (r.height / box.height) * 50) };
  }

  /** Where every part sits right now. */
  function measured(): Record<P, Point> {
    const box = frame.current!.getBoundingClientRect();
    const out = {} as Record<P, Point>;
    for (const part of parts) {
      const r = element(part)?.getBoundingClientRect();
      out[part] = r
        ? { x: clamp(((r.left + r.width / 2 - box.left) / box.width) * 100), y: clamp(((r.top + r.height / 2 - box.top) / box.height) * 100) }
        : { x: 50, y: 50 };
    }
    return out;
  }

  /** The current layout, completed with any part it does not place yet. */
  function current(): Record<P, Point> {
    if (!layout) return measured();
    const missing = parts.filter((p) => !layout[p]);
    if (missing.length === 0) return layout;
    const now = measured();
    return { ...layout, ...Object.fromEntries(missing.map((p) => [p, now[p]])) } as Record<P, Point>;
  }

  function onPointerDown(part: P, e: PointerEvent<HTMLElement>) {
    if (e.button !== 0 || !frame.current) return;
    e.preventDefault();
    const start = current();
    if (start !== layout) setLayout(start);
    drag.current = { part, px: e.clientX, py: e.clientY, start, rect: frame.current.getBoundingClientRect() };
    setSelected(part);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d) return;
    // Measured on every move: on the first drag out of the flow the part
    // changes size as it becomes placed, and the old size would clamp wrongly.
    const half = halfOf(d.part);
    const x = clamp(d.start[d.part].x + ((e.clientX - d.px) / d.rect.width) * 100, half.x, 100 - half.x);
    const y = clamp(d.start[d.part].y + ((e.clientY - d.py) / d.rect.height) * 100, half.y, 100 - half.y);
    setLayout({ ...d.start, [d.part]: { x, y } });
  }

  function onPointerUp(e: PointerEvent<HTMLElement>) {
    if (!drag.current) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function onKeyDown(part: P, e: KeyboardEvent<HTMLElement>) {
    const step = e.shiftKey ? 2 : 0.5;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!delta) return;
    e.preventDefault();
    const now = current();
    const half = halfOf(part);
    setSelected(part);
    setLayout({
      ...now,
      [part]: { x: clamp(now[part].x + delta[0], half.x, 100 - half.x), y: clamp(now[part].y + delta[1], half.y, 100 - half.y) },
    });
  }

  const bind = (part: P): HTMLAttributes<HTMLElement> => ({
    tabIndex: 0,
    role: "button",
    "aria-label": `${labels[part]} — sürükleyerek taşıyın`,
    onPointerDown: (e) => onPointerDown(part, e),
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onKeyDown: (e) => onKeyDown(part, e),
    onFocus: () => setSelected(part),
  });

  return { bind, selected, setSelected };
}
