"use client";

import { useState } from "react";
import { Check, TriangleAlert } from "lucide-react";

import { BANNER_PRESETS, DEFAULT_CUSTOM_COLOUR, isHexColour, isPreset, resolveTextColour } from "@/lib/banner";

/** The colour each preset mostly is, for the contrast check. */
const PRESET_BASE: Record<string, string> = {
  crimson_gradient: "#b91c1c",
  dark_luxury: "#18181b",
  festive_red: "#dc2626",
};

const TEXT_SWATCHES: { colour: string; label: string }[] = [
  { colour: "#ffffff", label: "Beyaz" },
  { colour: "#fde68a", label: "Altın" },
  { colour: "#111827", label: "Siyah" },
];

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio of two "#rrggbb" colours. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const cardClass = (selected: boolean) =>
  `flex min-w-0 flex-col rounded-xl border bg-white transition-[border-color,box-shadow] duration-200 dark:bg-zinc-950 ${
    selected
      ? "border-red-500 ring-4 ring-red-500/15"
      : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
  }`;
const colourInputClass =
  "h-8 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-white/15 dark:bg-zinc-950";
const chipClass = (selected: boolean) =>
  `inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-[border-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${
    selected
      ? "border-red-500 bg-white text-red-700 ring-4 ring-red-500/15 dark:bg-zinc-950 dark:text-red-300"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300"
  }`;

/**
 * The banner's look: its background (a style preset or a colour of the
 * admin's own) and its text colour (automatic, or chosen). Shared by the
 * default banner and the dated presets; with `inherit`, the background may
 * also be left to the default banner's (null).
 */
export function BannerLookPicker({
  id,
  background,
  onBackground,
  textColour,
  onTextColour,
  inherit,
}: {
  id: string;
  background: string | null;
  onBackground: (style: string | null) => void;
  textColour: string | null;
  onTextColour: (colour: string | null) => void;
  /** Offer "the default banner's look" (background null): its label and swatch. */
  inherit?: { label: string; swatchClass?: string; fill?: string };
}) {
  // The last colour of the admin's own, kept while a preset is tried.
  const [customBackground, setCustomBackground] = useState(
    background && isHexColour(background) ? background : DEFAULT_CUSTOM_COLOUR,
  );
  const [customText, setCustomText] = useState(resolveTextColour(textColour) ?? "#ffffff");
  const customSelected = background !== null && !isPreset(background);
  const text = resolveTextColour(textColour);
  const swatchText = TEXT_SWATCHES.some((s) => s.colour === text);

  const base = background === null ? null : isPreset(background) ? PRESET_BASE[background] : background;
  const lowContrast = text && base && isHexColour(base) ? contrast(text, base) < 4.5 : false;

  const options: { key: string; label: string; swatch: string; fill?: string; value: string | null; custom?: true }[] = [
    ...(inherit ? [{ key: "inherit", label: inherit.label, swatch: inherit.swatchClass ?? "", fill: inherit.fill, value: null }] : []),
    ...BANNER_PRESETS.map((p) => ({ key: p.id, label: p.label, swatch: p.swatchClass, value: p.id })),
    { key: "custom", label: "Özel renk", swatch: "", fill: customBackground, value: customBackground, custom: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p id={`${id}-bg-label`} className="text-sm font-medium">
          Arka plan
        </p>
        <div
          role="radiogroup"
          aria-labelledby={`${id}-bg-label`}
          className={`mt-2 grid w-full grid-cols-2 gap-3 ${inherit ? "sm:grid-cols-3 xl:grid-cols-5" : "lg:grid-cols-4"}`}
        >
          {options.map((option) => {
            const selected = option.custom ? customSelected : background === option.value;
            return (
              <div key={option.key} className={cardClass(selected)}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onBackground(option.value)}
                  className="block w-full rounded-xl p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                >
                  <span
                    aria-hidden
                    className={`relative block h-10 rounded-lg ${option.swatch}`}
                    style={option.fill ? { backgroundColor: option.fill } : undefined}
                  >
                    {selected && (
                      <Check className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-white p-0.5 text-red-600 shadow-sm" />
                    )}
                  </span>
                  <span className="mt-2 block truncate text-xs font-medium">{option.label}</span>
                </button>
                {option.custom && customSelected && (
                  <div className="flex items-center gap-2 border-t border-slate-200 px-2 py-2 dark:border-white/10">
                    <label htmlFor={`${id}-bg-colour`} className="sr-only">
                      Arka plan rengini seçin
                    </label>
                    <input
                      id={`${id}-bg-colour`}
                      type="color"
                      value={customBackground}
                      onChange={(e) => {
                        setCustomBackground(e.target.value);
                        onBackground(e.target.value);
                      }}
                      className={colourInputClass}
                    />
                    <code className="truncate text-xs uppercase tabular-nums text-slate-500 dark:text-zinc-400">
                      {customBackground}
                    </code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p id={`${id}-text-label`} className="text-sm font-medium">
          Metin rengi
        </p>
        <div role="radiogroup" aria-labelledby={`${id}-text-label`} className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={text === null}
            onClick={() => onTextColour(null)}
            className={chipClass(text === null)}
          >
            Otomatik
          </button>
          {TEXT_SWATCHES.map((s) => (
            <button
              key={s.colour}
              type="button"
              role="radio"
              aria-checked={text === s.colour}
              onClick={() => onTextColour(s.colour)}
              className={chipClass(text === s.colour)}
            >
              <span aria-hidden className="h-4 w-4 rounded-full ring-1 ring-inset ring-black/15" style={{ backgroundColor: s.colour }} />
              {s.label}
            </button>
          ))}
          <span className={`${chipClass(text !== null && !swatchText)} pe-1.5`}>
            <button type="button" role="radio" aria-checked={text !== null && !swatchText} onClick={() => onTextColour(customText)}>
              Özel
            </button>
            <label htmlFor={`${id}-text-colour`} className="sr-only">
              Metin rengini seçin
            </label>
            <input
              id={`${id}-text-colour`}
              type="color"
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                onTextColour(e.target.value);
              }}
              className="h-6 w-8 cursor-pointer rounded-full border border-slate-300 bg-white p-0.5 dark:border-white/15 dark:bg-zinc-950"
            />
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
          {lowContrast ? (
            <span className="inline-flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              Bu metin rengi zeminde zor okunur; daha açık ya da koyu bir renk seçin.
            </span>
          ) : (
            "Otomatik: zemine göre beyaz ya da koyu metin seçilir."
          )}
        </p>
      </div>
    </div>
  );
}
