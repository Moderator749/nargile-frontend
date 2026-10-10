// Special-day banner: background presets and countdown maths, shared by the
// homepage banner and the admin live preview.

import type { BannerBackgroundStyle, BannerIcon } from "@/types";

export type BannerPreset = "crimson_gradient" | "dark_luxury" | "festive_red";

export const BANNER_PRESETS: { id: BannerPreset; label: string; swatchClass: string }[] = [
  {
    id: "crimson_gradient",
    label: "Kırmızı geçiş",
    swatchClass: "bg-gradient-to-r from-red-800 via-red-600 to-red-800",
  },
  {
    id: "dark_luxury",
    label: "Koyu lüks",
    swatchClass: "bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-950 ring-1 ring-inset ring-amber-400/40",
  },
  {
    id: "festive_red",
    label: "Bayram kırmızısı",
    swatchClass: "bg-red-600 bg-[radial-gradient(circle,rgb(252_211_77/0.7)_1px,transparent_1.5px)] bg-[size:8px_8px]",
  },
];

export const DEFAULT_BANNER_STYLE: BannerPreset = "crimson_gradient";

export const BANNER_ICONS: { id: BannerIcon; label: string }[] = [
  { id: "celebration", label: "Kutlama" },
  { id: "memorial", label: "Anma / Milli gün" },
  { id: "campaign", label: "Kampanya" },
  { id: "none", label: "Simgesiz" },
];

export const DEFAULT_BANNER_ICON: BannerIcon = "celebration";

/** Unknown icon values (e.g. from a newer API) render as the default. */
export const resolveBannerIcon = (icon: string | undefined): BannerIcon =>
  BANNER_ICONS.some((i) => i.id === icon) ? (icon as BannerIcon) : DEFAULT_BANNER_ICON;
export const DEFAULT_CUSTOM_COLOUR = "#7c2d12";

const HEX_COLOUR = /^#[0-9a-f]{6}$/i;
// Mirrors the backend's IMAGE_URL_PATTERN: safe inside a CSS url("…").
const SAFE_IMAGE_URL = /^https?:\/\/[^\s"'()<>\\]+$/;
// The characters SAFE_IMAGE_URL rejects; percent-encoding them keeps the URL valid (mirrors the backend).
const URL_UNSAFE = /[\s"'()<>\\]/g;

export const isPreset = (style: string): style is BannerPreset => BANNER_PRESETS.some((p) => p.id === style);
export const isHexColour = (style: string): boolean => HEX_COLOUR.test(style);
export const isSafeImageUrl = (url: string): boolean => url.length <= 500 && SAFE_IMAGE_URL.test(url);

/** Trim and percent-encode spaces, quotes and parentheses, so URLs from any host pass isSafeImageUrl. */
export const normaliseImageUrl = (url: string): string =>
  url.trim().replace(URL_UNSAFE, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);

/** Readable text tone on a custom colour (WCAG relative luminance). */
export function toneFor(hex: string): "light" | "dark" {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  // Contrast against white beats contrast against near-black below ~0.18.
  return luminance > 0.18 ? "dark" : "light";
}

/** Unknown or malformed styles render as the default preset. */
export function resolveBannerStyle(style: BannerBackgroundStyle): BannerPreset | `#${string}` {
  if (isPreset(style)) return style;
  if (isHexColour(style)) return style.toLowerCase() as `#${string}`;
  return DEFAULT_BANNER_STYLE;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function countdownParts(remainingMs: number): CountdownParts {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

/** ISO instant → `<input type="datetime-local">` value in the browser's time zone. */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` value (browser time zone) → ISO instant with offset, or null. */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value); // no offset in the string: parsed as local time
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type BannerTone = "light" | "dark" | "gold";

/** Text/ornament tone; a background image always gets a dark scrim and light text. */
export function bannerTone(style: BannerBackgroundStyle, bgImageUrl: string | null): BannerTone {
  if (bgImageUrl && isSafeImageUrl(bgImageUrl)) return "light";
  const resolved = resolveBannerStyle(style);
  if (resolved === "dark_luxury") return "gold";
  return isHexColour(resolved) ? toneFor(resolved) : "light";
}
