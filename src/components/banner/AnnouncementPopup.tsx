"use client";

import { useEffect, useRef, useState } from "react";

import { PopupCard } from "@/components/banner/PopupCard";
import { useCmsText } from "@/components/i18n/useCmsText";
import { API_URL } from "@/lib/config";
import type { PopupAnnouncement } from "@/types";

/** The popup a visitor closed, by its last-saved time: an edited popup shows again. */
const DISMISSED_KEY = "announcement-popup-dismissed";

function dismissedVersion(): string | null {
  try {
    return localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

/**
 * "Açılış duyurusu": the card shown once when a visitor lands on the shop,
 * while the admin has it on and within its time range ("Duyurular").
 *
 * Read in the browser, like the top strip, so every page stays statically
 * rendered. Closing it — the X, "Tamam", Escape or the backdrop — is
 * remembered, so it does not come back on the next page or visit until the
 * admin changes it. Part of the storefront's layout only, so never shown in
 * the admin panel.
 */
export function AnnouncementPopup() {
  const [popup, setPopup] = useState<PopupAnnouncement | null>(null);
  // Written in Turkish in the panel; English and Arabic from the homepage translation memory.
  const cms = useCmsText();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/announcements/popup`, { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<PopupAnnouncement | null>) : null))
      .then((live) => {
        if (!live?.message) return;
        // The API drops popups outside their range; this covers the clock drifting in between.
        if (live.ends_at && Date.parse(live.ends_at) <= Date.now()) return;
        if (live.updated_at && dismissedVersion() === live.updated_at) return;
        setPopup(live);
      })
      .catch(() => {
        // Non-critical: no popup.
      });
    return () => controller.abort();
    // Once per visit: a client-side navigation does not ask again.
  }, []);

  const open = popup !== null;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    try {
      if (popup?.updated_at) localStorage.setItem(DISMISSED_KEY, popup.updated_at);
    } catch {
      // Storage blocked: closed for this visit only.
    }
    setPopup(null);
  }

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-popup-title"
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
    >
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] motion-safe:animate-[scrim-in_200ms_ease-out]"
        onClick={close}
        aria-hidden
      />
      <div className="relative w-full max-w-md motion-safe:animate-[popup-in_240ms_ease-out]">
        <PopupCard
          title={cms(popup.title)}
          message={cms(popup.message)}
          onClose={close}
          titleId="announcement-popup-title"
          closeRef={closeRef}
        />
      </div>
    </div>
  );
}
