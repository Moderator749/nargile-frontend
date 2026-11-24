"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { useLoyaltyBand } from "@/hooks/useLoyaltyBand";
import { homeMessages } from "@/lib/i18n/messages/home";
import { productMessages } from "@/lib/i18n/messages/product";
import { retailPerks } from "@/lib/perks";
import { bandText } from "@/lib/storeAdvantages";
import { sultanPuanPercent } from "@/lib/sultanPuan";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * The rate this price earns, worded for the page ("%10" in Turkish, "10%" in
 * English and Arabic), or null when it earns none — or when the viewer cannot
 * earn SultanPuan at all: it is a retail perk, so a signed-in kafe, bayi, toptan
 * or export account is never offered it (lib/perks, as the server rules).
 */
function useSultanPuanRate(priceInclTax: string | null | undefined): { rate: string; band: string } | null {
  const loyalty = useLoyaltyBand();
  const user = useAuthStore((s) => s.user);
  const { percent } = useMessages(homeMessages);
  if (user && !retailPerks(user)) return null;
  const rate = sultanPuanPercent(priceInclTax, loyalty);
  if (rate === null) return null;
  return { rate: percent(rate), band: bandText(loyalty.band_min, loyalty.band_max) };
}

/**
 * A loyalty mark, not a discount sticker: obsidian (#18181B) with a gold
 * hairline (#FACC15 at 35 %) and a soft shadow; the rate in gold over
 * "SultanPuan" in white, on two lines so it stays narrow beside a tall stem.
 * Gold on zinc-900 is about 12:1, white about 17:1.
 */
const RIBBON = "flex flex-col items-start bg-zinc-900 shadow-[0_6px_16px_-6px_rgb(0_0_0/0.55)]";
const RATE = "font-extrabold leading-none tracking-tight text-yellow-400";
const NAME = "font-semibold leading-none tracking-tight text-white";

/**
 * A product card's mark for a price inside the SultanPuan band (ProductCard):
 * a two-line ribbon flush in the photo's top start corner — the card's own
 * rounded, clipped corner shapes it there, so only its inner corner is rounded
 * and only its two inner edges carry the gold line. Its sides are logical (the
 * top right in Arabic, beside the deal clock's end); only the rate is set
 * left-to-right, so "10%" keeps its order there. On every card that earns
 * it: the homepage rows, category, brand and search.
 */
export function SultanPuanCardBadge({
  priceInclTax,
  className = "",
}: {
  priceInclTax: string | null | undefined;
  /** Placement from the card (the offsets that pull it into the corner). */
  className?: string;
}) {
  const shown = useSultanPuanRate(priceInclTax);
  if (!shown) return null;
  return (
    <span
      className={`${RIBBON} ${className} gap-1 rounded-ee-xl border-e border-b border-yellow-400/35 px-2.5 pb-2 pt-2.5 @max-[13rem]:gap-0.5 @max-[13rem]:px-2 @max-[13rem]:pb-1.5 @max-[13rem]:pt-2`}
    >
      <span dir="ltr" className={`${RATE} text-sm @max-[13rem]:text-[13px]`}>{shown.rate}</span>{" "}
      <span className={`${NAME} text-[11px] @max-[13rem]:text-[10px]`}>SultanPuan</span>
    </span>
  );
}

/**
 * The product page's: the same ribbon a size up, by the price, with the band it
 * holds for ("20.000–29.999 TL alışverişlerde") — the rate is earned on an order
 * of that size, so a basket pushed past the band no longer earns it.
 */
export function SultanPuanPriceCallout({ priceInclTax }: { priceInclTax: string | null | undefined }) {
  const shown = useSultanPuanRate(priceInclTax);
  const t = useMessages(productMessages).sultanPuan;
  if (!shown) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span
        className={`${RIBBON} gap-1 rounded-ss-xl rounded-ee-xl rounded-se-md rounded-es-md border border-yellow-400/35 px-3 pb-2 pt-2.5`}
      >
        <span dir="ltr" className={`${RATE} text-lg`}>{shown.rate}</span>{" "}
        <span className={`${NAME} text-xs`}>SultanPuan</span>
      </span>
      <span className="text-sm font-medium text-amber-900 dark:text-amber-200">{t.band(shown.band)}</span>
    </p>
  );
}
