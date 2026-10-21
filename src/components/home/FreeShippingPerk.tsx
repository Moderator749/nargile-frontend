"use client";

import { AMBER, BEAM, BeamGradient, DeliveryPerk, IDLE, RED, SpeedLines, Wheel } from "@/components/home/DeliveryPerk";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useShippingPerks } from "@/hooks/useShippingPerks";
import { PERKS_PAGE } from "@/lib/bilgi";
import { homeMessages } from "@/lib/i18n/messages/home";

/** The van's windows: a pale sky, light against its dark body in either theme. */
const GLASS = "rgb(186 230 253)";

/**
 * The free-shipping perk in the picks row's header, at its right: a delivery
 * van (`DeliveryPerk`) — boxy, its cab's windscreen raked, the shop's red
 * along its side — the lüle row's moto kurye's companion, and the threshold
 * beside it. The figure is the live one from "Parametreler"
 * (`useShippingPerks`), so it follows the panel.
 *
 * Free shipping over the threshold is a retail perk at checkout, so the perk
 * is left out for a signed-in B2B account.
 */
export function FreeShippingPerk({ className = "" }: { className?: string }) {
  const { show, thresholdTl } = useShippingPerks();
  const t = useMessages(homeMessages);
  if (!show) return null;
  const text = t.perks.shippingText(thresholdTl);

  return (
    <DeliveryPerk
      viewBox="0 0 150 76"
      width="w-[118px] sm:w-[140px]"
      href={`${PERKS_PAGE.href}#ucretsiz-kargo`}
      eyebrow={t.perks.shippingEyebrow}
      className={className}
      vehicle={
        <>
          <defs>
            <BeamGradient id="van-beam" />
          </defs>

          {/* Its shadow on the road. */}
          <ellipse cx={75} cy={71} rx={62} ry={2.5} fill="currentColor" opacity={0.08} />
          <SpeedLines x={-6} ys={[24, 34, 46]} />
          <Wheel cx={35} cy={59} r={11} />
          <Wheel cx={115} cy={59} r={11} />

          <g className={IDLE}>
            {/* The headlamp's beam, ahead of the van. */}
            <path d="M140 46 L168 38 L168 58 Z" fill="url(#van-beam)" className={BEAM} />

            {/* The body: cargo box and cab in one, the wheel arches cut out of it. */}
            <path
              d="M16 16 H96 Q100 16 100 20 V25 H120 Q124 25 126 28 L138 43 Q140 45 140 48 V55 Q140 58 137 58 H128 A13 13 0 0 0 102 58 H48 A13 13 0 0 0 22 58 H13 Q10 58 10 55 V22 Q10 16 16 16 Z"
              fill="currentColor"
            />

            {/* The windscreen, the cab door's seam and the bumper. */}
            <path d="M104 29 H119 L130 42 H104 Z" fill={GLASS} fillOpacity={0.95} />
            <path d="M101 25 V56" stroke="white" strokeOpacity={0.18} strokeWidth={1} />
            <path d="M135 56 H143" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />

            {/* The shop's red along the side, and a parcel on the panel. */}
            <rect x={14} y={36} width={82} height={6} rx={3} fill={RED} />
            <rect x={20} y={21} width={11} height={9} rx={1.5} fill="none" stroke="white" strokeOpacity={0.55} strokeWidth={1.25} />
            <path d="M25.5 21 V30" stroke="white" strokeOpacity={0.55} strokeWidth={1.25} />

            {/* Lamps: amber ahead, red behind. */}
            <circle cx={138} cy={48} r={2.2} fill={AMBER} />
            <rect x={9} y={40} width={2.5} height={7} rx={1} fill="rgb(239 68 68)" />
          </g>
        </>
      }
    >
      <p className="mt-1.5 max-w-[16rem] text-sm leading-snug text-neutral-600 dark:text-neutral-300">
        {text.before}
        <span className="font-semibold text-neutral-900 dark:text-white">{text.strong}</span>
        {text.after}
      </p>
    </DeliveryPerk>
  );
}
