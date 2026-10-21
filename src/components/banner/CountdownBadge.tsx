"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import type { BannerTone, CountdownParts } from "@/lib/banner";
import { bannerMessages } from "@/lib/i18n/messages/home";

const TONE: Record<BannerTone, string> = {
  light: "text-white/90",
  dark: "text-zinc-900/80",
  gold: "text-amber-100/90",
};

/** The ticker's units, largest first; each one's suffix is in the messages (`units`). */
const UNITS = ["days", "hours", "minutes", "seconds"] as const;

/**
 * Single-line ticker countdown ("02g 14sa 03dk 22sn"). `parts` is null before
 * hydration: monospaced "--" placeholders keep the exact width, so no shift.
 * In Arabic the units run right to left, days first at the right.
 */
export function CountdownBadge({ parts, tone }: { parts: CountdownParts | null; tone: BannerTone }) {
  const t = useMessages(bannerMessages);
  const label = parts ? t.timeLeftFull(parts.days, parts.hours, parts.minutes) : t.timeLeft;

  return (
    <span
      role="timer"
      aria-label={label}
      className={`inline-flex shrink-0 items-baseline gap-2 font-mono text-xs tabular-nums tracking-tight ${TONE[tone]}`}
    >
      {UNITS.map((key) => (
        <span key={key} aria-hidden>
          <span className="font-medium">{parts ? String(parts[key]).padStart(2, "0") : "--"}</span>
          <span className="opacity-60">{t.units[key]}</span>
        </span>
      ))}
    </span>
  );
}
