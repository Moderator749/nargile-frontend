"use client";

import { AMBER, BEAM, BeamGradient, DeliveryPerk, IDLE, RED, SpeedLines, Wheel } from "@/components/home/DeliveryPerk";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useShippingPerks } from "@/hooks/useShippingPerks";
import { PERKS_PAGE } from "@/lib/bilgi";
import { homeMessages } from "@/lib/i18n/messages/home";

/**
 * The courier perk in the lüle row's header, beside its title: İstanbul's
 * moto kurye (`DeliveryPerk`), line drawn with its box in the shop's red,
 * heading left toward the title (the picks row's van heads right), and one
 * line beside it: same-day delivery in İstanbul.
 *
 * Same-day delivery is offered as a retail perk (as on the product page), so
 * it is left out for a signed-in B2B account (`useShippingPerks`).
 */
export function CourierPerks() {
  const { show } = useShippingPerks();
  const t = useMessages(homeMessages);
  if (!show) return null;

  return (
    <DeliveryPerk
      viewBox="0 0 132 76"
      width="w-[104px] sm:w-[132px]"
      href={`${PERKS_PAGE.href}#istanbul-kurye`}
      eyebrow={t.perks.courierEyebrow}
      facing="left"
      className="self-start md:self-end"
      vehicle={
        <>
          <defs>
            <BeamGradient id="courier-beam" />
          </defs>

          {/* Its shadow on the road. */}
          <ellipse cx={66} cy={71} rx={50} ry={2.5} fill="currentColor" opacity={0.08} />
          <SpeedLines x={0} ys={[28, 37, 47]} />
          <Wheel cx={30} cy={58} r={12} />
          <Wheel cx={104} cy={58} r={12} />

          <g className={IDLE}>
            {/* The headlamp's beam, ahead of the bike. */}
            <path d="M97 32 L132 22 L132 46 Z" fill="url(#courier-beam)" className={BEAM} />

            {/* The courier's box, in the shop's red, on its rack. */}
            <rect x={10} y={21} width={30} height={23} rx={4} fill={RED} />
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
            <circle cx={94} cy={34} r={3} fill={AMBER} />

            {/* The rider, leaning into it. */}
            <path d="M58 40 L72 48 L68 58" fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M56 40 L64 18" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
            <path d="M63 22 L83 23" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={66} cy={11} r={8} fill="currentColor" />
            <path d="M67 8 Q75 8 75 12 L67 12 Z" fill={AMBER} fillOpacity={0.9} />
          </g>
        </>
      }
    >
      <p className="mt-1.5 text-sm font-semibold leading-snug text-neutral-900 dark:text-white">{t.perks.courierText}</p>
    </DeliveryPerk>
  );
}
