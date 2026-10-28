// Homepage modules. Content is managed in the admin panel (/admin/hero,
// /admin/promos) and served by /home/content; this file maps it to what the
// components render.

import type { ContentRequirement, HeroBgPosition, HeroButtonSize, HeroLayout, HeroSlideContent, HeroTextAlign, HeroTextColors, HeroTextSizes, PromoBoxContent, SocialWidget } from "@/types";

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
  /** None when the admin left the button's text empty. */
  cta?: { label: string; href: string };
  /** Shown to guests only (hidden pre-paint once logged in). */
  guestCta?: { label: string; href: string };
  /** Optional background photo, shown at 30% under a vignette; null = CSS spotlight only. */
  image: string | null;
  /** A portrait photo shown in its place on a phone ("Mobil Yönetim"); the wide one is cropped without it. */
  mobileImage?: string | null;
  align: HeroTextAlign;
  /** The photo's focal point (0–100 %) and zoom (100 = fills the slide). */
  focus: { x: number; y: number };
  zoom: number;
  /** Free part positions on a wide screen (lg and up); null = centred stack. */
  layout: HeroLayout | null;
  /** The dark wash over the photo. */
  overlay: boolean;
  /** The admin's size and colour per text; none set, the slide's own. */
  sizes?: HeroTextSizes | null;
  colors?: HeroTextColors | null;
  /** A phone's own design (below `md`); each part null keeps how a phone has always shown it. */
  mobile?: { layout: HeroLayout | null; sizes: HeroTextSizes | null; bg: HeroBgPosition | null };
  /** Its buttons' size, from a tablet up and on a phone ("md" = the shop's own). */
  buttonSize?: { desktop: HeroButtonSize; mobile: HeroButtonSize };
}

export const toHeroSlide = (s: HeroSlideContent): HeroSlide => ({
  id: String(s.id),
  eyebrow: s.eyebrow,
  title: s.title,
  subtitle: s.subtitle,
  cta: s.cta_label.trim() && s.cta_href ? { label: s.cta_label, href: s.cta_href } : undefined,
  guestCta: s.guest_cta_label && s.guest_cta_href ? { label: s.guest_cta_label, href: s.guest_cta_href } : undefined,
  image: s.image,
  mobileImage: s.mobile_image ?? null,
  // A slide saved before the sizes existed has the shop's own.
  buttonSize: { desktop: s.button_size_desktop ?? "md", mobile: s.button_size_mobile ?? "md" },
  align: s.text_align ?? "center",
  focus: { x: s.image_focus_x ?? 50, y: s.image_focus_y ?? 50 },
  zoom: s.image_zoom ?? 100,
  layout: s.layout ?? null,
  // Rows from before the design fields read as they always looked.
  overlay: s.enable_overlay ?? true,
  sizes: s.font_sizes ?? null,
  colors: s.text_colors ?? null,
  mobile: {
    layout: s.mobile_layout ?? null,
    sizes: s.mobile_font_sizes ?? null,
    bg: s.mobile_bg_position ?? null,
  },
});

/**
 * The shop's own hero photographs, for a slide without a photo of its own. The
 * three slides a new database is seeded with (the backend's homepage_content
 * migration) have none until one is uploaded in /admin/hero, and would stand
 * as bare dark banners. In those slides' order, so each gets the photo it was
 * first shown with.
 */
export const DEFAULT_HERO_IMAGES = ["/images/hero-1.jpg", "/images/hero-2.jpg", "/images/hero-3.jpg"] as const;

/** The slide, with the default photo for its place in the CMS list if it has none of its own. */
export const withDefaultImage = (slide: HeroSlide, index: number): HeroSlide =>
  slide.image ? slide : { ...slide, image: DEFAULT_HERO_IMAGES[index % DEFAULT_HERO_IMAGES.length] };

/** Shown when the CMS has no slide to show (or is unreachable), so the homepage never loses its hero. */
export const FALLBACK_SLIDE: HeroSlide = {
  id: "fallback",
  eyebrow: "Nargile Malzemesi",
  title: "Kusursuz Mühendislik. Saf Deneyim.",
  subtitle: "Nargile Takımları, Lüleler ve Premium Sarf Malzemeleri.",
  cta: { label: "Kataloğu Keşfet", href: "/catalog" },
  image: DEFAULT_HERO_IMAGES[0],
  align: "center",
  focus: { x: 50, y: 50 },
  zoom: 100,
  layout: null,
  overlay: true,
};

// ── The promo box beside the hero ─────────────────────────────────────────────

export interface PromoBox {
  id: string;
  eyebrow: string;
  title: string;
  text?: string;
  href: string;
  /** The channel links and the jump button's text. */
  widget: SocialWidget | null;
  /** The community card's title and the advantages card's line; absent = the site's own copy. */
  topTitle?: string;
  bottomText?: string;
}

/** The box beside the hero: the first active one whose requirement is met (the API sends them in order). */
export function heroPromo(boxes: PromoBoxContent[], has: Record<Requirement, boolean>): PromoBox | undefined {
  const b = boxes.find((box) => box.is_active && meets(box.requires, has));
  return (
    b && {
      id: String(b.id),
      eyebrow: b.eyebrow,
      title: b.title,
      text: b.text ?? undefined,
      href: b.href,
      widget: b.widget,
      topTitle: b.top_title ?? undefined,
      bottomText: b.bottom_text ?? undefined,
    }
  );
}

// ── Images ────────────────────────────────────────────────────────────────────

/** Hosts next/image may optimise (must match next.config.ts images.remotePatterns). */
const OPTIMISED_HOSTS = new Set(["www.nargilemalzemesi.com"]);

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Where browsers load the API's uploads from, as next.config.ts reads it:
 * beside /api/v1 under NEXT_PUBLIC_API_URL — /media on the API itself, or
 * /api/backend/media through this site's proxy. Not API_URL, which is one
 * address on the server and another in the browser, and would render a photo
 * two ways.
 */
const MEDIA = (() => {
  try {
    const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1");
    return new URL(`${api.pathname.replace(/\/api\/v1\/?$/, "")}/media/`, api.origin);
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
    if (!MEDIA || !url.pathname.startsWith(MEDIA.pathname)) return false;
    if (url.origin === MEDIA.origin) return true;
    return LOOPBACK.has(MEDIA.hostname) && LOOPBACK.has(url.hostname) && url.port === MEDIA.port;
  } catch {
    return false;
  }
}
