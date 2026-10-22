"use client";

import { useId } from "react";

import { adminSelectClass } from "@/components/admin/ContentEditor";
import { HERO_FONT_PX } from "@/components/home/HeroSlideView";
import type { HeroFontSize } from "@/types";

const SIZES = Object.entries(HERO_FONT_PX) as [HeroFontSize, number][];

/** The two colours most photos need, a click away. */
const PRESETS = [
  { value: "#FFFFFF", label: "Beyaz" },
  { value: "#000000", label: "Siyah" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * A slide text's size and colour, under its field: "Varsayılan" keeps the
 * slide's own (as every slide had before), a size is its pixels on the widest
 * slider (smaller on a phone), a colour is any #rrggbb.
 */
export function TextStyleFields({
  label,
  size,
  color,
  onSize,
  onColor,
}: {
  /** The text's name, for the controls' accessible names ("Başlık"). */
  label: string;
  size: HeroFontSize | null | undefined;
  color: string | null | undefined;
  onSize: (size: HeroFontSize | null) => void;
  onColor: (color: string | null) => void;
}) {
  const id = useId();
  const hex = color ?? "";
  return (
    <div className="-mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-zinc-400">
      <label htmlFor={`${id}-size`} className="flex items-center gap-2">
        Boyut
        <select
          id={`${id}-size`}
          value={size ?? ""}
          onChange={(e) => onSize((e.target.value || null) as HeroFontSize | null)}
          aria-label={`${label} yazı boyutu`}
          className={`${adminSelectClass} h-8 w-auto py-0 text-xs`}
        >
          <option value="">Varsayılan</option>
          {SIZES.map(([key, px]) => (
            <option key={key} value={key}>
              {key.toUpperCase()} · {px}px
            </option>
          ))}
        </select>
      </label>
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
