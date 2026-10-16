// Homepage modules. Content is managed in the admin panel (/admin/hero,
// /admin/promos, /admin/advantages) and served by /home/content; this file maps
// it to what the components render.

import { API_URL } from "@/lib/config";
import type {
  ContentRequirement,
  HeroLayout,
  HeroSlideContent,
  HeroTextAlign,
  OverlayDirection,
  PromoBoxContent,
  PromoLayout,
  SocialWidget,
} from "@/types";

export type Requirement = ContentRequirement;

/** Whether content that `requires` something may show, given what exists right now. */
export const meets = (requires: Requirement | null | undefined, has: Record<Requirement, boolean>) =>
  !requires || has[requires];

export const catalogSearchHref = (q: string) => `/catalog?q=${encodeURIComponent(q)}`;

// ── Module 5: hero slider ─────────────────────────────────────────────────────

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  /** Shown to guests only (hidden pre-paint once logged in). */
  guestCta?: { label: string; href: string };
  /** Optional background photo, shown at 30% under a vignette; null = CSS spotlight only. */
  image: string | null;
  align: HeroTextAlign;
  /** The photo's focal point (0–100 %) and zoom (100 = fills the slide). */
  focus: { x: number; y: number };
  zoom: number;
  /** Free part positions on a wide screen (lg and up); null = centred stack. */
  layout: HeroLayout | null;
}

export const toHeroSlide = (s: HeroSlideContent): HeroSlide => ({
  id: String(s.id),
  eyebrow: s.eyebrow,
  title: s.title,
  subtitle: s.subtitle,
  cta: { label: s.cta_label, href: s.cta_href },
  guestCta: s.guest_cta_label && s.guest_cta_href ? { label: s.guest_cta_label, href: s.guest_cta_href } : undefined,
  image: s.image,
  align: s.text_align ?? "center",
  focus: { x: s.image_focus_x ?? 50, y: s.image_focus_y ?? 50 },
  zoom: s.image_zoom ?? 100,
  layout: s.layout ?? null,
});

/** Shown only if the CMS is unreachable, so the homepage never loses its hero. */
export const FALLBACK_SLIDE: HeroSlide = {
  id: "fallback",
  eyebrow: "Nargile Malzemesi",
  title: "Kusursuz Mühendislik. Saf Deneyim.",
  subtitle: "Endüstriyel Nargile ve Premium Sarf Malzemeleri.",
  cta: { label: "Kataloğu Keşfet", href: "/catalog" },
  image: null,
  align: "center",
  focus: { x: 50, y: 50 },
  zoom: 100,
  layout: null,
};

// ── Modules 6 & 7: smart promo grids ──────────────────────────────────────────
// Up to 3 boxes per row; inactive boxes (or ones whose requirement is unmet)
// drop out and the rest stretch to fill the row.

export interface PromoBox {
  id: string;
  variant: PromoBoxContent["variant"];
  eyebrow: string;
  title: string;
  text?: string;
  href: string;
  image?: string;
  badge?: "sok";
  /** Free part positions on a wide screen (lg and up); null = the stacked card. */
  layout: PromoLayout | null;
  /** The full-bleed photo's dark veil direction, focal point and zoom. */
  overlay: OverlayDirection;
  focus: { x: number; y: number };
  zoom: number;
  /** The split social & advantages card's links (variant "social"). */
  widget: SocialWidget | null;
}

export const PROMO_ROWS_COUNT = 2;
export const PROMO_BOXES_PER_ROW = 3;

/** Active boxes per row (row 1, row 2), in order, at most 3 each. */
export function promoRows(boxes: PromoBoxContent[], has: Record<Requirement, boolean>): PromoBox[][] {
  return Array.from({ length: PROMO_ROWS_COUNT }, (_, i) =>
    boxes
      .filter((b) => b.row === i + 1 && b.is_active && meets(b.requires, has))
      .slice(0, PROMO_BOXES_PER_ROW)
      .map((b) => ({
        id: String(b.id),
        variant: b.variant,
        eyebrow: b.eyebrow,
        title: b.title,
        text: b.text ?? undefined,
        href: b.href,
        image: b.image ?? undefined,
        badge: b.badge ?? undefined,
        layout: b.layout ?? null,
        overlay: b.overlay_direction ?? "to-t",
        focus: { x: b.image_focus_x ?? 50, y: b.image_focus_y ?? 50 },
        zoom: b.image_zoom ?? 100,
        widget: b.widget ?? null,
      })),
  );
}

// ── Images ────────────────────────────────────────────────────────────────────

/** Hosts next/image may optimise (must match next.config.ts images.remotePatterns). */
const OPTIMISED_HOSTS = new Set(["www.nargilemalzemesi.com"]);

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** Where the API serves uploads from: its own origin, under /media. */
const MEDIA_ORIGIN = (() => {
  try {
    return new URL(API_URL);
  } catch {
    return null;
  }
})();

/**
 * Whether next/image may resize and re-encode this photo (WebP/AVIF, one width
 * per screen) — exactly the addresses next.config.ts lets it fetch: the old
 * store's photos, our /public files and the API's own /media uploads (either
 * loopback spelling on a developer's machine). An admin image from any other
 * host is shown as it is.
 */
export function canOptimiseImage(src: string): boolean {
  if (src.startsWith("/")) return true; // /public
  try {
    const url = new URL(src);
    if (OPTIMISED_HOSTS.has(url.hostname)) return true;
    if (!MEDIA_ORIGIN || !url.pathname.startsWith("/media/")) return false;
    if (url.origin === MEDIA_ORIGIN.origin) return true;
    return LOOPBACK.has(MEDIA_ORIGIN.hostname) && LOOPBACK.has(url.hostname) && url.port === MEDIA_ORIGIN.port;
  } catch {
    return false;
  }
}
