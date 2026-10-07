"use client";

import { CountdownBadge } from "@/components/banner/CountdownBadge";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import { useNow } from "@/hooks/useNow";
import { bannerTone, countdownParts } from "@/lib/banner";
import type { Announcement } from "@/types";

/** Clock ticks per second, so the bar unmounts one tick after it starts fading. */
const UNMOUNT_AFTER_MS = -1000;

interface LiveAnnouncementBarProps {
  announcement: Pick<Announcement, "message" | "expires_at" | "show_countdown" | "background_style" | "bg_image_url" | "icon_type">;
  /** Fade out and unmount at expiry (storefront). The admin preview keeps it visible. */
  hideOnExpire?: boolean;
  onDismiss?: () => void;
}

/** The banner plus its ticking countdown and client-side expiry. */
export function LiveAnnouncementBar({ announcement, hideOnExpire = true, onDismiss }: LiveAnnouncementBarProps) {
  const parsed = announcement.expires_at ? Date.parse(announcement.expires_at) : NaN;
  const expiresAt = Number.isNaN(parsed) ? null : parsed;
  const now = useNow(expiresAt !== null);
  const remaining = expiresAt !== null && now !== null ? expiresAt - now : null;
  const expired = remaining !== null && remaining <= 0;

  if (hideOnExpire && remaining !== null && remaining <= UNMOUNT_AFTER_MS) return null;

  const fading = hideOnExpire && expired;
  return (
    <div
      aria-hidden={fading || undefined}
      className={`transition-opacity duration-300 ease-out motion-reduce:transition-none ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <AnnouncementBar
        message={announcement.message}
        backgroundStyle={announcement.background_style}
        bgImageUrl={announcement.bg_image_url}
        icon={announcement.icon_type}
        onDismiss={onDismiss}
        aside={
          announcement.show_countdown && expiresAt !== null ? (
            <CountdownBadge
              parts={remaining === null ? null : countdownParts(remaining)}
              tone={bannerTone(announcement.background_style, announcement.bg_image_url)}
            />
          ) : null
        }
      />
    </div>
  );
}
