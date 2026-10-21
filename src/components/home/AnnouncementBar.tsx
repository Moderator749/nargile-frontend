"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { BannerMoodIcon } from "@/components/banner/BannerMoodIcon";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { bannerTone, isHexColour, isSafeImageUrl, resolveBannerIcon, resolveBannerStyle } from "@/lib/banner";
import { bannerMessages } from "@/lib/i18n/messages/home";
import type { BannerBackgroundStyle, BannerIcon } from "@/types";

interface AnnouncementBarProps {
  message: string;
  backgroundStyle: BannerBackgroundStyle;
  bgImageUrl: string | null;
  icon: BannerIcon;
  /** Optional slot next to the text, e.g. a countdown badge. */
  aside?: ReactNode;
  /** Shows a close button (storefront); the admin preview omits it. */
  onDismiss?: () => void;
}

const SURFACE = {
  crimson_gradient: "bg-gradient-to-r from-red-800 via-red-600 to-red-800",
  dark_luxury: "bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950",
  festive_red: "bg-red-600",
} as const;

const TEXT = { light: "text-white", dark: "text-zinc-950", gold: "text-amber-50" } as const;
const CLOSE = {
  light: "text-white/60 hover:bg-white/10 hover:text-white",
  dark: "text-zinc-900/60 hover:bg-black/10 hover:text-zinc-900",
  gold: "text-amber-100/60 hover:bg-white/10 hover:text-amber-50",
} as const;

/**
 * Special-day banner as a slim ticker tape. Presentational only — rendered by the homepage and by the
 * admin live preview (both via LiveAnnouncementBar), so both look identical.
 */
export function AnnouncementBar({ message, backgroundStyle, bgImageUrl, icon, aside, onDismiss }: AnnouncementBarProps) {
  const t = useMessages(bannerMessages);
  const style = resolveBannerStyle(backgroundStyle);
  const custom = isHexColour(style);
  const image = bgImageUrl && isSafeImageUrl(bgImageUrl) ? bgImageUrl : null;
  const tone = bannerTone(style, image);
  const mood = resolveBannerIcon(icon);
  const iconClass = `hidden shrink-0 sm:block ${tone === "gold" ? "text-amber-300" : ""}`;

  return (
    <section
      aria-label={t.announcement}
      className={`relative isolate overflow-hidden border-b border-black/20 ${custom ? "" : SURFACE[style as keyof typeof SURFACE]} ${TEXT[tone]}`}
      style={custom ? { backgroundColor: style } : undefined}
    >
      {image && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center"
            // JSON string quoting doubles as CSS string quoting; the URL is pre-validated.
            style={{ backgroundImage: `url(${JSON.stringify(image)})` }}
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-black/50" />
        </>
      )}
      {custom && !image && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/15 via-transparent to-black/15"
        />
      )}
      {style === "dark_luxury" && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
        </>
      )}
      {style === "festive_red" && !image && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,rgb(252_211_77/0.35)_1.5px,transparent_2px),radial-gradient(circle,rgb(255_255_255/0.25)_1px,transparent_1.5px)] bg-[size:28px_28px,18px_18px] bg-[position:0_0,9px_9px]"
        />
      )}
      {style === "crimson_gradient" && !image && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.14)_1px,transparent_0)] bg-[size:14px_14px]"
        />
      )}
      {/* A slow, faint light sweep; disabled for reduced motion. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 -left-1/3 -z-10 w-1/3 bg-gradient-to-r from-transparent to-transparent motion-safe:animate-[sheen_9s_ease-in-out_infinite] ${
          tone === "gold" ? "via-amber-200/[0.06]" : tone === "dark" ? "via-white/20" : "via-white/10"
        }`}
      />

      {/* The shop's own strip, not a footnote: it carries the greeting on an
          ordinary day and a commemoration on others, and it is given the
          height to say so. One line at every width, so the page below never
          moves when the message changes. */}
      <div
        className={`mx-auto flex min-h-12 max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 py-3.5 text-center sm:min-h-[3.25rem] sm:py-4 ${onDismiss ? "ps-4 pe-12 sm:px-12" : "px-4 sm:px-6"}`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <BannerMoodIcon icon={mood} className={iconClass} />
          <p className="text-pretty text-xs font-semibold tracking-wide sm:text-sm">{message}</p>
          <BannerMoodIcon icon={mood} className={iconClass} mirrored />
        </div>
        {aside}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t.close}
          className={`absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current ${CLOSE[tone]}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </section>
  );
}
