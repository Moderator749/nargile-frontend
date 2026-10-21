import type { ReactNode } from "react";

import Link from "@/components/i18n/Link";

/**
 * A delivery perk in a product row's header: a line-drawn vehicle driving in
 * place, straight on the page with no frame around it, and its words beside
 * it — the moto courier over the lüle row (`CourierPerks`), the van over the
 * picks (`FreeShippingPerk`).
 *
 * "In place": the wheels turn, the body idles a hair up and down, the road's
 * dashes flow back beneath it, speed lines stream off its tail and the
 * headlamp breathes; the vehicle itself never travels, so nothing beside it
 * moves. Everything stands still for a visitor who asks for reduced motion
 * (motion-safe:). The keyframes are in globals.css.
 *
 * The whole block — vehicle and words — is a link to its section of
 * "Ayrıcalıklar ve Avantajlar", fading a touch under the pointer.
 *
 * Drawn facing right; `facing="left"` mirrors the drawing and its road
 * together, so everything follows: the wheels turn the other way, the beam
 * leads to the left, the speed lines stream off the right and the road flows
 * back to the right. The courier faces left, toward its row's title, while
 * the van above faces right.
 *
 * In Arabic the header mirrors (the title at the right, the perks at the
 * left), so does the drawing: `facing` is as seen on a left-to-right page,
 * and each vehicle turns round in a right-to-left one.
 */

/** Turns about its own centre: a wheel's spokes, inside its still tyre. */
const SPIN = "[transform-box:fill-box] origin-center motion-safe:animate-wheel-spin";

/** The body a vehicle carries on its springs: it idles over the wheels. */
export const IDLE = "motion-safe:animate-vehicle-idle";

/** The headlamp's beam, breathing. */
export const BEAM = "motion-safe:animate-beam-pulse";

/** The colours both vehicles share: the shop's red, the lamps' amber. */
export const RED = "rgb(220 38 38)";
export const AMBER = "rgb(252 211 77)";

/** A wheel: the tyre, and the spokes and hub that turn inside it. */
export function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spoke = r * 0.75;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={3.5} />
      <g className={SPIN}>
        {[0, 60, 120].map((deg) => {
          const dx = Math.round(spoke * Math.cos((deg * Math.PI) / 180) * 100) / 100;
          const dy = Math.round(spoke * Math.sin((deg * Math.PI) / 180) * 100) / 100;
          return (
            <line key={deg} x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy} stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" />
          );
        })}
        <circle cx={cx} cy={cy} r={2.5} fill="currentColor" />
      </g>
    </g>
  );
}

/** Lines streaming off the tail at these heights, one after another. */
export function SpeedLines({ x, ys }: { x: number; ys: number[] }) {
  return ys.map((y, i) => (
    <line
      key={y}
      x1={x}
      x2={x + 8}
      y1={y}
      y2={y}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      opacity={0.35}
      className="motion-safe:animate-speed-line"
      style={{ animationDelay: `${i * 0.3}s` }}
    />
  ));
}

/** The headlamp's gradient, by id (ids are page-wide: each vehicle has its own). */
export function BeamGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor={AMBER} stopOpacity="0.6" />
      <stop offset="1" stopColor={AMBER} stopOpacity="0" />
    </linearGradient>
  );
}

export function DeliveryPerk({
  vehicle,
  viewBox,
  width,
  eyebrow,
  children,
  facing = "right",
  href,
  className = "",
}: {
  /** The vehicle's drawing, inside an <svg> of `viewBox`. */
  vehicle: ReactNode;
  viewBox: string;
  /** The drawing's width classes (its height follows the viewBox). */
  width: string;
  /** The small red label over the words. */
  eyebrow: string;
  children: ReactNode;
  /** Which way it drives: as drawn, or mirrored. */
  facing?: "right" | "left";
  /** Where the whole block leads (its section of the perks page). */
  href: string;
  /** Its place in the header (alignment). */
  className?: string;
}) {
  return (
    // Facing left, the speed lines trail toward the words (up to 14px past
    // the drawing as they fade), so the gap is wider that way round.
    <Link
      href={href}
      className={`flex items-center rounded-xl transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
        facing === "left" ? "gap-6 sm:gap-7" : "gap-3 sm:gap-4"
      } ${className}`}
    >
      <div aria-hidden className={`shrink-0 text-neutral-900 dark:text-white ${width} ${facing === "left" ? "ltr:-scale-x-100" : "rtl:-scale-x-100"}`}>
        <svg viewBox={viewBox} className="block h-auto w-full overflow-visible">
          {vehicle}
        </svg>
        {/* The road, its dashes flowing back. */}
        <div className="mt-0.5 h-[2px] w-full bg-[repeating-linear-gradient(90deg,currentColor_0_8px,transparent_8px_18px)] opacity-25 motion-safe:animate-road-flow" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-400">{eyebrow}</p>
        {children}
      </div>
    </Link>
  );
}
