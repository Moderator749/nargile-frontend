"use client";

import type { ReactNode } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { openConsentPreferences } from "@/lib/consent";
import { consentMessages } from "@/lib/i18n/messages/consent";

/** "Çerez Tercihleri": opens the cookie banner again, to change an earlier choice. */
export function CookiePreferencesButton({ className, icon }: { className?: string; icon?: ReactNode }) {
  const m = useMessages(consentMessages);
  return (
    <button type="button" onClick={openConsentPreferences} className={className}>
      {icon}
      <span>{m.preferences}</span>
    </button>
  );
}
