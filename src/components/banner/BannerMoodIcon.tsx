import { PartyPopper, Zap } from "lucide-react";

import type { BannerIcon } from "@/types";

/** Turkish flag drawn to the statutory proportions (viewBox height = G = 20). */
function TurkishFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <rect width="30" height="20" rx="1.5" fill="#E30A17" />
      <circle cx="10" cy="10" r="5" fill="#fff" />
      <circle cx="11.25" cy="10" r="4" fill="#E30A17" />
      <polygon
        fill="#fff"
        points="15.917,10 17.644,9.439 17.644,7.622 18.712,9.092 20.44,8.531 19.372,10 20.44,11.469 18.712,10.908 17.644,12.378 17.644,10.561"
      />
    </svg>
  );
}

/**
 * Inline-SVG mood icon (no emoji: the 🇹🇷 flag emoji renders as "TR" on Windows).
 * Sizing is fixed here (20px square icons, 24×16 flag; smaller with `small`); `className` adds colour/visibility.
 * `mirrored` flips directional icons for the trailing side of the banner text.
 */
export function BannerMoodIcon({
  icon,
  className = "",
  mirrored = false,
  small = false,
}: {
  icon: BannerIcon;
  className?: string;
  mirrored?: boolean;
  /** Ticker size: 16px icons, 18×12 flag. */
  small?: boolean;
}) {
  const square = small ? "h-4 w-4" : "h-5 w-5";
  switch (icon) {
    case "celebration":
      return <PartyPopper className={`${square} ${mirrored ? "-scale-x-100" : ""} ${className}`} aria-hidden />;
    case "memorial":
      return <TurkishFlag className={`${small ? "h-3 w-[18px]" : "h-4 w-6"} rounded-[2px] shadow-sm ${className}`} />;
    case "campaign":
      return <Zap className={`${square} fill-current ${className}`} aria-hidden />;
    case "none":
      return null;
  }
}
