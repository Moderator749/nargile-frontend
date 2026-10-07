// Admin-chosen colours (the "Fırsat rengi"): validated, and given readable ink.

/** "#rrggbb" for anything the admin may have typed, or null if it isn't a colour. */
export function normalizeHex(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim().replace(/^#/, "");
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return null;
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw;
  return `#${full.toLowerCase()}`;
}

const channel = (hex: string, at: number) => {
  const srgb = Number.parseInt(hex.slice(at, at + 2), 16) / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

/**
 * Black or white text for a solid background, by WCAG relative luminance — a
 * lemon badge needs black ink, a crimson one white.
 */
export function readableInk(hex: string): "#000000" | "#ffffff" {
  const luminance = 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  return luminance > 0.45 ? "#000000" : "#ffffff";
}
