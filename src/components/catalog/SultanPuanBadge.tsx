"use client";

import { GoldCoinBadge } from "@/components/home/GoldCoinBadge";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useLoyaltyBand } from "@/hooks/useLoyaltyBand";
import { homeMessages } from "@/lib/i18n/messages/home";
import { productMessages } from "@/lib/i18n/messages/product";
import { loyaltyPerks } from "@/lib/perks";
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
  if (user && !loyaltyPerks(user)) return null;
  const rate = sultanPuanPercent(priceInclTax, loyalty);
  if (rate === null) return null;
  return { rate: percent(rate), band: bandText(loyalty.band_min, loyalty.band_max) };
}

/**
 * The mark is type and the coin, no box: "%10" and the minted "SP" coin on one
 * line, "SultanPuan" under it. The rate line is set left-to-right in every
 * language, so the lockup reads "10% (SP)" in Arabic as well.
 */
function Mark({ rate, size, ink }: { rate: string; size: "card" | "page"; ink: { rate: string; name: string } }) {
  const card = size === "card";
  return (
    <>
      <span dir="ltr" className={`flex items-center ${card ? "gap-1" : "gap-1.5"}`}>
        <span className={`${RATE} ${ink.rate} ${card ? "text-[15px] @max-[13rem]:text-sm" : "text-2xl"}`}>{rate}</span>
        <GoldCoinBadge size={card ? "sm" : "md"} />
      </span>{" "}
      <span className={`${NAME} ${ink.name} ${card ? "text-[11px] @max-[13rem]:text-[10px]" : "text-sm"}`}>SultanPuan</span>
    </>
  );
}

const RATE = "font-extrabold leading-none tracking-tight tabular-nums";
const NAME = "font-semibold leading-none tracking-tight";
/**
 * On a card it sits on the photo, and the photo's plate is light in both themes
 * (white, or the dark theme's light plate): deep amber and charcoal ink, about
 * 7:1 and 16:1 on white, with a soft white halo so a busy photo edge under it
 * does not eat the letters. Not a background: nothing boxes it.
 */
const ON_PHOTO = "[text-shadow:0_0_2px_#fff,0_0_8px_rgb(255_255_255/0.9)]";
const CARD_INK = { rate: "text-amber-800", name: "text-zinc-900" };
/** The product page's ink follows the theme: it sits on the page, not a photo. */
const PAGE_INK = { rate: "text-amber-800 dark:text-amber-300", name: "text-zinc-900 dark:text-zinc-100" };

/**
 * A product card's mark for a price inside the SultanPuan band (ProductCard),
 * in the photo's top start corner — the top right in Arabic, the deal clock
 * keeping the other end. On every card that earns it: the homepage rows,
 * category, brand and search.
 */
export function SultanPuanCardBadge({
  priceInclTax,
  className = "",
}: {
  priceInclTax: string | null | undefined;
  /** Placement from the card, if any. */
  className?: string;
}) {
  const shown = useSultanPuanRate(priceInclTax);
  if (!shown) return null;
  return (
    <span
      className={`flex flex-col items-start gap-1 ${ON_PHOTO} ${className}`}
    >
      <Mark rate={shown.rate} size="card" ink={CARD_INK} />
    </span>
  );
}

/**
 * The product page's: the same mark a size up, by the price, with the band it
 * holds for ("20.000–29.999 TL alışverişlerde") — the rate is earned on an order
 * of that size, so a basket pushed past the band no longer earns it. It sits on
 * the page itself here, so its ink follows the theme.
 */
export function SultanPuanPriceCallout({ priceInclTax }: { priceInclTax: string | null | undefined }) {
  const shown = useSultanPuanRate(priceInclTax);
  const t = useMessages(productMessages).sultanPuan;
  if (!shown) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="flex flex-col items-start gap-1">
        <Mark rate={shown.rate} size="page" ink={PAGE_INK} />
      </span>
      <span className="text-sm font-medium text-amber-900 dark:text-amber-200">{t.band(shown.band)}</span>
    </p>
  );
}
