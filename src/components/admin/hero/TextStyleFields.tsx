"use client";

import { Maximize2, RotateCcw } from "lucide-react";

import { heroTextPx } from "@/components/home/HeroSlideView";

/** The two colours most photos need, a click away. */
const PRESETS = [
  { value: "#FFFFFF", label: "Beyaz" },
  { value: "#000000", label: "Siyah" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * A slide text's size and colour, under its field. The size is set on the
 * preview, by dragging the selected text's red corner; here it is read out,
 * with the way back to the slide's own. "Varsayılan" keeps the slide's own
 * colour (as every slide had before); a colour is any #rrggbb.
 */
export function TextStyleFields({
  label,
  size,
  color,
  onSize,
  mobileSize,
  onMobileSize,
  onColor,
}: {
  /** The text's name, for the controls' accessible names ("Başlık"). */
  label: string;
  /** Px on the widest slider; a name of the editor's first version is read as its px. */
  size: number | string | null | undefined;
  /** A phone's own size, set in the canvas's "Mobil" view. */
  mobileSize?: number | string | null;
  color: string | null | undefined;
  /** Only ever back to the slide's own (null): sizes are set by dragging. */
  onSize: (size: null) => void;
  onMobileSize?: (size: null) => void;
  onColor: (color: string | null) => void;
}) {
  const px = heroTextPx(size);
  const mobilePx = heroTextPx(mobileSize);
  const hex = color ?? "";
  return (
    <div className="-mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-zinc-400">
      <span className="flex items-center gap-2" aria-live="polite">
        <Maximize2 className="h-3.5 w-3.5 text-slate-400" aria-hidden />
        Boyut:{" "}
        <span className="font-mono font-medium tabular-nums text-slate-800 dark:text-zinc-200">
          {px ? `${px}px` : "Varsayılan"}
        </span>
        {px ? (
          <button
            type="button"
            onClick={() => onSize(null)}
            aria-label={`${label} boyutunu varsayılana döndür`}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <RotateCcw className="h-3 w-3" aria-hidden /> Sıfırla
          </button>
        ) : (
          <span className="text-slate-400">— önizlemede yazıyı seçip kırmızı köşesinden sürükleyin</span>
        )}
        {mobilePx ? (
          <>
            <span className="text-slate-300 dark:text-zinc-600">·</span>
            Mobil:{" "}
            <span className="font-mono font-medium tabular-nums text-slate-800 dark:text-zinc-200">{mobilePx}px</span>
            <button
              type="button"
              onClick={() => onMobileSize?.(null)}
              aria-label={`${label} mobil boyutunu varsayılana döndür`}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <RotateCcw className="h-3 w-3" aria-hidden /> Sıfırla
            </button>
          </>
        ) : null}
      </span>
      <span className="flex items-center gap-2" role="group" aria-label={`${label} rengi`}>
        Renk
        <button
          type="button"
          onClick={() => onColor(null)}
          aria-pressed={!color}
          className={`h-8 rounded-lg border px-2 font-medium ${
            !color
              ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
              : "border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
          }`}
        >
          Varsayılan
        </button>
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onColor(p.value)}
            aria-pressed={color?.toUpperCase() === p.value}
            title={p.label}
            className={`h-8 w-8 rounded-lg border-2 ${
              color?.toUpperCase() === p.value ? "border-red-500" : "border-slate-200 dark:border-white/15"
            }`}
            style={{ background: p.value }}
          >
            <span className="sr-only">{p.label}</span>
          </button>
        ))}
        <input
          type="color"
          value={HEX.test(hex) ? hex : "#ffffff"}
          onChange={(e) => onColor(e.target.value.toUpperCase())}
          aria-label={`${label} rengi seç`}
          className="h-8 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/15 dark:bg-zinc-900"
        />
        <input
          value={hex}
          onChange={(e) => {
            const v = e.target.value.trim();
            onColor(v ? (v.startsWith("#") ? v : `#${v}`).toUpperCase() : null);
          }}
          placeholder="#RRGGBB"
          maxLength={7}
          aria-label={`${label} rengi (hex)`}
          aria-invalid={!!color && !HEX.test(color)}
          className={`h-8 w-24 rounded-lg border bg-white px-2 font-mono text-xs dark:bg-zinc-900 ${
            color && !HEX.test(color) ? "border-red-400" : "border-slate-200 dark:border-white/15"
          }`}
        />
      </span>
    </div>
  );
}
