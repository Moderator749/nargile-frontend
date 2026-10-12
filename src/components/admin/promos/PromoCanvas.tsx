"use client";

import { useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Move, RotateCcw } from "lucide-react";

import { useDragLayout } from "@/components/admin/useDragLayout";
import { PROMO_CARD_WIDTH, PromoCardView } from "@/components/home/PromoCardView";
import type { PromoBox } from "@/lib/home";
import type { OverlayDirection, PromoBoxWrite, PromoLayout, PromoPart } from "@/types";

const LABELS: Record<PromoPart, string> = {
  eyebrow: "Üst etiket",
  title: "Başlık",
  text: "Metin",
  button: "Buton / Link",
};

const DIRECTIONS: { value: OverlayDirection; label: string; Icon: typeof ArrowRight }[] = [
  { value: "to-r", label: "Soldan sağa", Icon: ArrowRight },
  { value: "to-l", label: "Sağdan sola", Icon: ArrowLeft },
  { value: "to-b", label: "Yukarıdan aşağı", Icon: ArrowDown },
  { value: "to-t", label: "Aşağıdan yukarı", Icon: ArrowUp },
];

/** Shown at one and a half times the card's real size: easier to drag, identical in proportion. */
const ZOOM = 1.5;

/** The form as the storefront's card, so the canvas renders exactly what will ship. */
function previewBox(v: PromoBoxWrite, image: string | null): PromoBox {
  return {
    id: "preview",
    variant: v.variant,
    eyebrow: v.eyebrow || "Üst etiket",
    title: v.title || "Başlık",
    text: v.text || undefined,
    href: v.href || "/",
    image: image || undefined,
    badge: v.badge ?? undefined,
    layout: v.layout,
    overlay: v.overlay_direction,
    focus: { x: v.image_focus_x, y: v.image_focus_y },
    zoom: v.image_zoom,
    widget: null,
  };
}

/**
 * The card on a live canvas — the storefront's own card at its real width,
 * magnified — with its parts draggable. Positions are kept in % of the card,
 * so a part dropped here is where it renders on the homepage.
 */
export function PromoCanvas({
  value: v,
  set,
  image,
}: {
  value: PromoBoxWrite;
  set: (patch: Partial<PromoBoxWrite>) => void;
  image: string | null;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const box = previewBox(v, image);
  // The parts this card actually has: no text line, no text part.
  const parts = (["eyebrow", "title", "text", "button"] as const).filter((p) => p !== "text" || !!box.text);
  const { bind, selected, setSelected } = useDragLayout<PromoPart>({
    frame,
    parts,
    layout: v.layout as Record<PromoPart, { x: number; y: number }> | null,
    setLayout: (layout) => set({ layout: layout as PromoLayout }),
    labels: LABELS,
  });

  return (
    <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <legend className="px-1 text-sm font-medium text-slate-700 dark:text-zinc-300">Yerleşim & görsel</legend>

      <div className="flex flex-wrap items-center gap-3">
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
          <Move className="h-3.5 w-3.5" aria-hidden /> Öğeleri sürükleyin; seçiliyken ok tuşlarıyla ince ayar (Shift: hızlı).
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

      {/* The card at its storefront width, on the storefront's background. */}
      <div className="flex justify-center rounded-xl bg-background p-6">
        <div className="flex" style={{ width: PROMO_CARD_WIDTH, zoom: ZOOM }}>
          <div ref={frame} className="flex w-full">
            <PromoCardView box={box} editor={{ selected, bind }} />
          </div>
        </div>
      </div>

      <ul className="grid gap-2 text-xs sm:grid-cols-4">
        {parts.map((part) => {
          const point = v.layout ? v.layout[part] : null;
          return (
            <li
              key={part}
              className={`rounded-lg border px-3 py-2 ${selected === part ? "border-red-400 bg-red-50/60 dark:bg-red-500/10" : "border-slate-200 dark:border-white/10"}`}
            >
              <span className="block font-medium">{LABELS[part]}</span>
              <span className="font-mono tabular-nums text-slate-500">{point ? `${point.x.toFixed(1)}% · ${point.y.toFixed(1)}%` : "akışta"}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
        Serbest konumlu kart geniş ekranlarda (1024px ve üzeri) 4:3 oranında gösterilir; tablet ve telefonda öğeler okunaklı kalması için alt alta dizilir.
      </p>

      {/* The photo: which way its veil runs, and how it is cropped. */}
      <div className={`space-y-3 border-t border-slate-200 pt-4 dark:border-white/10 ${box.image ? "" : "opacity-50"}`}>
        {!box.image && <p className="text-xs text-slate-500 dark:text-zinc-400">Görsel ekleyince kart görselle tam kaplanır; bu ayarlar onu düzenler.</p>}
        <div className="space-y-1.5">
          <p id="promo-overlay" className="text-xs font-medium text-slate-600 dark:text-zinc-400">
            Gölge yönü
          </p>
          <div role="radiogroup" aria-labelledby="promo-overlay" className="flex flex-wrap gap-1.5">
            {DIRECTIONS.map(({ value, label, Icon }) => {
              const active = v.overlay_direction === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!box.image}
                  onClick={() => set({ overlay_direction: value })}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["image_zoom", "Yakınlaştırma", 100, 200],
              ["image_focus_x", "Odak — yatay", 0, 100],
              ["image_focus_y", "Odak — dikey", 0, 100],
            ] as const
          ).map(([key, label, min, max]) => (
            <label key={key} className="block space-y-1">
              <span className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
                {label}
                <span className="font-mono tabular-nums">{v[key]}%</span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                value={v[key]}
                disabled={!box.image}
                onChange={(e) => set({ [key]: Number(e.target.value) })}
                className="h-2 w-full cursor-pointer accent-red-600 disabled:cursor-not-allowed"
              />
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
}
