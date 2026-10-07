import type { BannerTone, CountdownParts } from "@/lib/banner";

const TONE: Record<BannerTone, string> = {
  light: "text-white/90",
  dark: "text-zinc-900/80",
  gold: "text-amber-100/90",
};

const UNITS = [
  { key: "days", suffix: "g" },
  { key: "hours", suffix: "sa" },
  { key: "minutes", suffix: "dk" },
  { key: "seconds", suffix: "sn" },
] as const;

/**
 * Single-line ticker countdown ("02g 14sa 03dk 22sn"). `parts` is null before
 * hydration: monospaced "--" placeholders keep the exact width, so no shift.
 */
export function CountdownBadge({ parts, tone }: { parts: CountdownParts | null; tone: BannerTone }) {
  const label = parts
    ? `Kalan süre: ${parts.days} gün ${parts.hours} saat ${parts.minutes} dakika`
    : "Kalan süre";

  return (
    <span
      role="timer"
      aria-label={label}
      className={`inline-flex shrink-0 items-baseline gap-2 font-mono text-xs tabular-nums tracking-tight ${TONE[tone]}`}
    >
      {UNITS.map(({ key, suffix }) => (
        <span key={key} aria-hidden>
          <span className="font-medium">{parts ? String(parts[key]).padStart(2, "0") : "--"}</span>
          <span className="opacity-60">{suffix}</span>
        </span>
      ))}
    </span>
  );
}
