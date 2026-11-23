"use client";

import { SultanPuanMark } from "@/components/icons/LoyaltyIcons";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useLoyaltyBand } from "@/hooks/useLoyaltyBand";
import { homeMessages } from "@/lib/i18n/messages/home";
import { productMessages } from "@/lib/i18n/messages/product";
import { retailPerks } from "@/lib/perks";
import { bandText } from "@/lib/storeAdvantages";
import { sultanPuanPercent } from "@/lib/sultanPuan";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * The rate this price earns, worded for the page ("%10 SultanPuan", "10%
 * SultanPuan"), or null when it earns none — or when the viewer cannot earn
 * SultanPuan at all: it is a retail perk, so a signed-in kafe, bayi, toptan or
 * export account is never offered it (lib/perks, as the server rules).
 */
function useSultanPuanLabel(priceInclTax: string | null | undefined): { label: string; band: string } | null {
  const loyalty = useLoyaltyBand();
  const user = useAuthStore((s) => s.user);
  const { percent } = useMessages(homeMessages);
  if (user && !retailPerks(user)) return null;
  const rate = sultanPuanPercent(priceInclTax, loyalty);
  if (rate === null) return null;
  return { label: `${percent(rate)} SultanPuan`, band: bandText(loyalty.band_min, loyalty.band_max) };
}

/**
 * Gold, bold and solid: amber-950 on amber-300→400 is well past 7:1, and the
 * white hairline and the warm shadow lift it off a white product photo.
 */
const PILL =
  "inline-flex items-center whitespace-nowrap rounded-full bg-gradient-to-b from-amber-300 to-amber-400 font-extrabold tracking-tight text-amber-950 shadow-[0_4px_12px_-4px_rgb(180_83_9/0.65)] ring-1 ring-inset ring-amber-700/30";

/**
 * A product card's mark for a price inside the SultanPuan band: "%10
 * SultanPuan" on the photo's top start corner (ProductCard). It replaced the
 * small "SP" coin the homepage's SultanPuan row laid over its cards, and is on
 * every card that earns it — the homepage rows, category, brand and search.
 */
export function SultanPuanCardBadge({ priceInclTax }: { priceInclTax: string | null | undefined }) {
  const shown = useSultanPuanLabel(priceInclTax);
  if (!shown) return null;
  return (
    <span
      dir="ltr"
      className={`${PILL} gap-1 px-2.5 py-1 text-xs @max-[13rem]:px-2 @max-[13rem]:py-0.5 @max-[13rem]:text-[11px]`}
    >
      <SultanPuanMark className="-ms-1 h-4 w-4 shrink-0 @max-[13rem]:hidden" />
      {shown.label}
    </span>
  );
}

/**
 * The product page's: the same gold pill, a size up, by the price, with the
 * band it holds for ("20.000–29.999 TL alışverişlerde") — the rate is earned
 * on an order of that size, so a basket pushed past the band no longer earns it.
 */
export function SultanPuanPriceCallout({ priceInclTax }: { priceInclTax: string | null | undefined }) {
  const shown = useSultanPuanLabel(priceInclTax);
  const t = useMessages(productMessages).sultanPuan;
  if (!shown) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      <span dir="ltr" className={`${PILL} gap-1.5 px-3.5 py-1.5 text-base`}>
        <SultanPuanMark className="-ms-1 h-5 w-5 shrink-0" />
        {shown.label}
      </span>
      <span className="text-sm font-medium text-amber-900 dark:text-amber-200">{t.band(shown.band)}</span>
    </p>
  );
}
