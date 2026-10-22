"use client";

import { useRef, type HTMLAttributes, type KeyboardEvent, type PointerEvent } from "react";
import { AlignCenter, AlignLeft, AlignRight, Move, RotateCcw } from "lucide-react";

import { useDragLayout } from "@/components/admin/useDragLayout";
import { HERO_DEFAULT_PX, HERO_FRAME, HeroBackdrop, HeroSlideView, heroTextPx } from "@/components/home/HeroSlideView";
import type { HeroSlide } from "@/lib/home";
import type { HeroPart, HeroSlideWrite, HeroTextAlign } from "@/types";

const ALIGNMENTS: { value: HeroTextAlign; label: string; Icon: typeof AlignLeft }[] = [
  { value: "left", label: "Sola", Icon: AlignLeft },
  { value: "center", label: "Ortaya", Icon: AlignCenter },
  { value: "right", label: "Sağa", Icon: AlignRight },
];

const PARTS: { part: HeroPart; label: string }[] = [
  { part: "eyebrow", label: "Üst etiket" },
  { part: "title", label: "Başlık" },
  { part: "subtitle", label: "Alt metin" },
  { part: "button", label: "Buton" },
];

export const rangeClass = "h-2 w-full cursor-pointer accent-red-600";

type SlideText = "eyebrow" | "title" | "subtitle";
const TEXT_LABEL: Record<SlideText, string> = { eyebrow: "Üst etiket", title: "Başlık", subtitle: "Alt metin" };
const MIN_PX = 8;
const MAX_PX = 160;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

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

/** The form as the storefront's slide, so the canvas renders exactly what will ship. */
function previewSlide(v: HeroSlideWrite, image: string | null): HeroSlide {
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
    align: v.text_align,
    focus: { x: v.image_focus_x, y: v.image_focus_y },
    zoom: v.image_zoom,
    layout: v.layout,
    overlay: v.enable_overlay,
    sizes: v.font_sizes,
    colors: v.text_colors,
  };
}

/**
 * "Yerleşim & görsel kırpma": the slide on a live canvas — the storefront's own
 * slide component at the storefront's own proportions — with its four parts
 * draggable. Positions are kept in % of the slide, so a part dropped here is
 * where it renders on the homepage at any wide screen.
 */
export function SlideCanvas({
  value: v,
  set,
  image,
}: {
  value: HeroSlideWrite;
  set: (patch: Partial<HeroSlideWrite>) => void;
  image: string | null;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const { bind, selected, setSelected } = useDragLayout<HeroPart>({
    frame,
    parts: PARTS.map((p) => p.part),
    layout: v.layout,
    setLayout: (layout) => set({ layout }),
    labels: Object.fromEntries(PARTS.map((p) => [p.part, p.label])) as Record<HeroPart, string>,
  });

  const slide = previewSlide(v, image);
  /** The parts this slide has: an empty text, or no button, is not on the slide. */
  const present: Record<HeroPart, boolean> = {
    eyebrow: !!v.eyebrow.trim(),
    title: !!v.title.trim(),
    subtitle: !!v.subtitle.trim(),
    button: !!v.cta_label.trim() || (!!v.guest_cta_label?.trim() && !!v.guest_cta_href?.trim()),
  };

  // ── Drag a text's corner: its size follows the drag ─────────────────────────
  const resizing = useRef<{ part: SlideText; from: number; height: number; x: number; y: number } | null>(null);
  const pxOf = (part: SlideText) => heroTextPx(v.font_sizes?.[part]) ?? HERO_DEFAULT_PX[part];
  const setPx = (part: SlideText, px: number) =>
    set({ font_sizes: { ...(v.font_sizes ?? {}), [part]: Math.round(clamp(px, MIN_PX, MAX_PX)) } });

  const resize = (part: SlideText): HTMLAttributes<HTMLElement> => ({
    role: "slider",
    tabIndex: 0,
    "aria-label": `${TEXT_LABEL[part]} boyutu — köşeden sürükleyin ya da oklarla değiştirin`,
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
  const panning = useRef<{ x: number; y: number; focus: { x: number; y: number }; reach: { x: number; y: number } } | null>(null);
  const pan: HTMLAttributes<HTMLDivElement> = {
    onPointerDown: (e) => {
      // A text, a button or a handle has its own drag; the photo is everything else.
      if (!image || e.button !== 0 || (e.target as HTMLElement).closest("[data-part],[data-resize]")) return;
      e.preventDefault();
      const stage = e.currentTarget.getBoundingClientRect();
      panning.current = {
        x: e.clientX,
        y: e.clientY,
        focus: { x: v.image_focus_x, y: v.image_focus_y },
        reach: overflowOf(e.currentTarget.querySelector("img"), stage, v.image_zoom),
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
      set({
        image_focus_x: along(e.clientX - p.x, p.reach.x, p.focus.x),
        image_focus_y: along(e.clientY - p.y, p.reach.y, p.focus.y),
      });
    },
    onPointerUp: (e) => {
      panning.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    },
  };
  pan.onPointerCancel = pan.onPointerUp;

  return (
    <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <legend className="px-1 text-sm font-medium text-slate-700 dark:text-zinc-300">Yerleşim & görsel kırpma</legend>

      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Metin hizası" className="flex gap-1.5">
          {ALIGNMENTS.map(({ value, label, Icon }) => {
            const active = v.text_align === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ text_align: value })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </button>
            );
          })}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
          <Move className="h-3.5 w-3.5" aria-hidden /> Yazıları sürükleyerek taşıyın; seçili yazıyı kırmızı köşesinden
          sürükleyerek büyütüp küçültün; fotoğrafı boş yerinden sürükleyerek kaydırın.
        </p>
        <button
          type="button"
          disabled={!v.layout}
          onClick={() => {
            set({ layout: null });
            setSelected(null);
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Konumları Sıfırla
        </button>
      </div>

      {/* The storefront's slide, in the storefront's frame. */}
      <div ref={frame} className={`${HERO_FRAME} mx-auto w-full max-w-[1024px]`}>
        <HeroBackdrop />
        <HeroSlideView
          slide={slide}
          heading="div"
          editor={{ selected, bind, resize }}
          wrapperProps={pan}
          className={image ? "cursor-move touch-none" : ""}
        >
          {/* Where the slide's own controls sit, so nothing is dropped under them. */}
          {v.layout && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[38%] bottom-[2.52cqw] hidden h-[3.78cqw] items-center justify-center rounded-full border border-dashed border-white/25 text-[1cqw] text-white/40 lg:flex"
            >
              slayt kontrolleri
            </div>
          )}
        </HeroSlideView>
      </div>

      <ul className="grid gap-2 text-xs sm:grid-cols-4">
        {PARTS.map(({ part, label }) => (
          <li
            key={part}
            className={`rounded-lg border px-3 py-2 ${selected === part ? "border-red-400 bg-red-50/60 dark:bg-red-500/10" : "border-slate-200 dark:border-white/10"}`}
          >
            <span className="font-medium">{label}</span>
            <span className="float-right font-mono tabular-nums text-slate-500">
              {!present[part] ? "yok" : v.layout ? `${v.layout[part].x.toFixed(1)}% · ${v.layout[part].y.toFixed(1)}%` : "ortalı"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
        Serbest konumlar geniş ekranlarda (1024px ve üzeri) uygulanır; tablet ve telefonda öğeler okunaklı kalması için ortalı dizilir.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["image_focus_x", "Görsel odağı — yatay", 0, 100],
            ["image_focus_y", "Görsel odağı — dikey", 0, 100],
            ["image_zoom", "Yakınlaştırma", 100, 200],
          ] as const
        ).map(([key, label, min, max]) => (
          <label key={key} className="block space-y-1">
            <span className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
              {label}
              <span className="font-mono tabular-nums">{v[key]}%</span>
            </span>
            <input type="range" min={min} max={max} value={v[key]} onChange={(e) => set({ [key]: Number(e.target.value) })} className={rangeClass} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
