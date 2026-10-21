"use client";

import { useCallback, useEffect, useState } from "react";

import { LiveAnnouncementBar } from "@/components/banner/LiveAnnouncementBar";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useCmsText } from "@/components/i18n/useCmsText";
import { DEFAULT_BANNER_STYLE } from "@/lib/banner";
import { API_URL } from "@/lib/config";
import { chromeMessages } from "@/lib/i18n/messages/layout";
import type { Announcement } from "@/types";

/** What the strip says when the shop has no special day running (in Turkish; the strip reads it in the page's language). */
export const WELCOME = chromeMessages.tr.welcome;

/**
 * The strip across the very top of the storefront.
 *
 * It renders through the same `AnnouncementBar` the admin panel previews, so
 * what /admin/banner shows is what the shop gets: its background (a preset, a
 * colour of the admin's own, or an image), its icon — the flags of a memorial
 * day as readily as a party popper — and its countdown. Nothing here decides
 * how a banner looks; that was the bug this replaced, a hard-coded red strip
 * with a party popper on it, celebrating 10 Kasım.
 *
 * The strip is always there and always one line tall, so it can never push the
 * page around: the welcome renders with the HTML, and the live banner replaces
 * it once it is read. Reading it in the browser rather than on the server is
 * what keeps every page statically rendered while the message stays current.
 *
 * When the banner on show ends while the visitor is here — a scheduled
 * "Hazır metin" reaching its end — the welcome stands in at once and the strip
 * asks again, so the default banner comes back without a reload.
 */
export function TopBanner() {
  const m = useMessages(chromeMessages);
  const [live, setLive] = useState<Announcement | null>(null);
  // The admin writes the banner in Turkish; its English and Arabic come from
  // the homepage translation memory.
  const cms = useCmsText();
  const [round, setRound] = useState(0);
  const expired = useCallback(() => {
    setLive(null);
    setRound((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/banners/active`, { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Announcement | null>) : null))
      .then((announcement) => {
        if (!announcement?.is_active || !announcement.message) return;
        // The API drops expired banners; this covers the clock drifting in between.
        if (announcement.expires_at && Date.parse(announcement.expires_at) <= Date.now()) return;
        setLive(announcement);
      })
      .catch(() => {
        // Non-critical: the welcome stands.
      });
    return () => controller.abort();
  }, [round]);

  if (live) {
    const message = cms(live.message);
    return <LiveAnnouncementBar key={`${message}|${live.expires_at}`} announcement={{ ...live, message }} onExpire={expired} />;
  }

  // The greeting is not an announcement: the house gradient, and no icon to
  // read anything into.
  return (
    <AnnouncementBar
      message={m.welcome}
      backgroundStyle={DEFAULT_BANNER_STYLE}
      bgImageUrl={null}
      icon="none"
    />
  );
}
