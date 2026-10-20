"use client";

import { useShippingPerks } from "@/hooks/useShippingPerks";

/** Turns about its own centre: a wheel's spokes, inside its still tyre. */
const SPIN = "[transform-box:fill-box] origin-center motion-safe:animate-wheel-spin";

/** A wheel at (cx, 58): the tyre, and the spokes and hub that turn inside it. */
function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy={58} r={12} fill="none" stroke="currentColor" strokeWidth={3.5} />
      <g className={SPIN}>
        {[0, 60, 120].map((deg) => {
          const dx = Math.round(9 * Math.cos((deg * Math.PI) / 180) * 100) / 100;
          const dy = Math.round(9 * Math.sin((deg * Math.PI) / 180) * 100) / 100;
          return (
            <line key={deg} x1={cx - dx} y1={58 - dy} x2={cx + dx} y2={58 + dy} stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" />
          );
        })}
        <circle cx={cx} cy={58} r={2.5} fill="currentColor" />
      </g>
    </g>
  );
}

/**
 * The courier perk in the lüle row's header, beside its title: İstanbul's
 * moto kurye standing straight on the page, no frame around it — line drawn,
 * its box in the shop's red — driving in place: the wheels turn, the bike
 * idles a hair up and down, the road's dashes flow back beneath it, speed
 * lines stream off its tail and the headlamp breathes. Nothing around it
 * moves, and all of it stands still for a visitor who asks for reduced motion
 * (motion-safe:). Beside it, one line: same-day delivery in İstanbul.
 *
 * Same-day delivery is offered as a retail perk (as on the product page), so
 * it is left out for a signed-in B2B account (`useShippingPerks`).
 */
export function CourierPerks() {
  const { show } = useShippingPerks();
  if (!show) return null;

  return (
    <div className="flex items-center gap-3 self-start sm:gap-4 md:self-end">
      <div aria-hidden className="w-[104px] shrink-0 text-neutral-900 sm:w-[132px] dark:text-white">
        <svg viewBox="0 0 132 76" className="block h-auto w-full overflow-visible">
          <defs>
            <linearGradient id="courier-beam" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="rgb(252 211 77)" stopOpacity="0.6" />
              <stop offset="1" stopColor="rgb(252 211 77)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Its shadow on the road. */}
          <ellipse cx={66} cy={71} rx={50} ry={2.5} fill="currentColor" opacity={0.08} />

          {/* Speed lines off the tail. */}
          {[
            { y: 28, delay: "0s" },
            { y: 37, delay: "0.3s" },
            { y: 47, delay: "0.6s" },
          ].map(({ y, delay }) => (
            <line
              key={y}
              x1={0}
              x2={8}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.35}
              className="motion-safe:animate-speed-line"
              style={{ animationDelay: delay }}
            />
          ))}

          <Wheel cx={30} />
          <Wheel cx={104} />

          {/* Everything the springs carry: it idles above the wheels. */}
          <g className="motion-safe:animate-moto-idle">
            {/* The headlamp's beam, ahead of the bike. */}
            <path d="M97 32 L132 22 L132 46 Z" fill="url(#courier-beam)" className="motion-safe:animate-beam-pulse" />

            {/* The courier's box, in the shop's red, on its rack. */}
            <rect x={10} y={21} width={30} height={23} rx={4} fill="rgb(220 38 38)" />
            <line x1={10} x2={40} y1={28} y2={28} stroke="white" strokeOpacity={0.3} strokeWidth={1} />
            <rect x={17} y={33} width={16} height={3} rx={1.5} fill="white" fillOpacity={0.85} />
            <path d="M14 48 H44 M25 44 V48" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />

            {/* Fenders, swingarm, exhaust and fork. */}
            <path d="M18 52 A12 12 0 0 1 41 50" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            <path d="M93 52 A12 12 0 0 1 115 51" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            <path d="M30 58 L52 50" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
            <path d="M50 61 L23 63" stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
            <path d="M104 58 L88 30" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />

            {/* Engine, body and seat. */}
            <rect x={48} y={46} width={20} height={12} rx={3} fill="currentColor" />
            <path d="M40 46 H70 L86 38 L80 33 H66 L58 40 H44 Z" fill="currentColor" />
            <path d="M38 44 Q50 39 66 41" fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />

            {/* Bars and headlamp. */}
            <path d="M88 30 L83 22 M83 22 L91 21" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={94} cy={34} r={3} fill="rgb(252 211 77)" />

            {/* The rider, leaning into it. */}
            <path d="M58 40 L72 48 L68 58" fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M56 40 L64 18" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
            <path d="M63 22 L83 23" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={66} cy={11} r={8} fill="currentColor" />
            <path d="M67 8 Q75 8 75 12 L67 12 Z" fill="rgb(252 211 77)" fillOpacity={0.9} />
          </g>
        </svg>
        {/* The road, its dashes flowing back. */}
        <div className="mt-0.5 h-[2px] w-full bg-[repeating-linear-gradient(90deg,currentColor_0_8px,transparent_8px_18px)] opacity-25 motion-safe:animate-road-flow" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-400">Kurye Ayrıcalığı</p>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-neutral-900 dark:text-white">İstanbul içi aynı gün teslimat</p>
      </div>
    </div>
  );
}
