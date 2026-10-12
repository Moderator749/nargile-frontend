// Homepage modules. Content is managed in the admin panel (/admin/hero,
// /admin/promos, /admin/advantages) and served by /home/content; this file maps
// it to what the components render.

import type { ContentRequirement, HeroSlideContent, HeroTextAlign, PromoBoxContent } from "@/types";

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
      })),
  );
}

// ── Images ────────────────────────────────────────────────────────────────────

/** Hosts next/image may optimise (must match next.config.ts images.remotePatterns). */
const OPTIMISED_HOSTS = new Set(["www.nargilemalzemesi.com"]);

/**
 * Admin images can come from any https host or from our own /media uploads,
 * which aren't in remotePatterns: those are shown as-is (unoptimised).
 */
export function canOptimiseImage(src: string): boolean {
  if (src.startsWith("/")) return true; // /public
  try {
    return OPTIMISED_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}
