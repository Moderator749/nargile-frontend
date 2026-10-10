"use client";

import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";

import { API_URL } from "@/lib/config";
import type { Announcement } from "@/types";

/** What the strip says when the shop has no special day running. */
export const WELCOME = "SULTAN NARGİLE'YE HOŞGELDİNİZ / ÖZEL GÜN KUTLAMA ALANI";

/**
 * The strip across the very top of the storefront.
 *
 * It is always there and always one line tall, so it can never push the page
 * around: the welcome is rendered with the HTML, and the special-day message an
 * admin sets in /admin/banner replaces the text once it is read. Reading it
 * from the browser rather than on the server is what keeps every page
 * statically rendered while the message stays current.
 */
export function TopBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/banners/active`, { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Announcement | null>) : null))
      .then((live) => {
        if (!live?.is_active || !live.message) return;
        // The API drops expired banners; this covers the clock drifting in between.
        if (live.expires_at && Date.parse(live.expires_at) <= Date.now()) return;
        setMessage(live.message);
      })
      .catch(() => {
        // Non-critical: the welcome stands.
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-accent to-red-700 text-white">
      {/* Half again as tall as a toolbar row, and the type with it: this is the
          shop's own greeting, not a footnote. One line at every width, so the
          page below it never moves. */}
      <p className="mx-auto flex min-h-[3.375rem] max-w-7xl items-center justify-center gap-2.5 overflow-hidden px-4 py-2.5 text-center text-sm font-semibold uppercase leading-tight tracking-[0.12em] sm:gap-3 sm:px-6 sm:text-base">
        <PartyPopper className="h-5 w-5 shrink-0 sm:h-[22px] sm:w-[22px]" aria-hidden />
        <span className="truncate">{message ?? WELCOME}</span>
      </p>
    </div>
  );
}
