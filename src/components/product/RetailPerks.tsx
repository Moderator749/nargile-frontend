"use client";

import { BadgePercent, Clock, Crown, Landmark, ShieldCheck, ShoppingCart, Truck, type LucideIcon } from "lucide-react";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { formatMoneyCompact } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { formatPercent, productMessages } from "@/lib/i18n/messages/product";
import { retailPerks } from "@/lib/perks";
import { useAuthStore } from "@/store/useAuthStore";
import type { ParameterTier, StoreParameters, User } from "@/types";

interface Perk {
  Icon: LucideIcon;
  title: string;
  note: string;
}

/**
 * The terms a retail buyer gets. Three of them are what checkout computes, read
 * from the live parameters ("Parametreler" in the panel): the free shipping
 * threshold, the havale ladder and Sultan Puan — each left out while the panel
 * has it switched off or empty. The other two are the shop's own promises
 * rather than anything the cart arithmetic knows about.
 */
/**
 * "%5 – %7": the span of the havale ladder's rates, or null when it gives
 * nothing — `rateRange` (lib/storeParameters), with the percentage written the
 * page's way ("5% – 7%" in English and Arabic).
 */
function rateSpan(tiers: ParameterTier[], locale: Locale): string | null {
  const rates = tiers.map((t) => Number(t.rate)).filter((r) => r > 0);
  if (!rates.length) return null;
  const low = Math.min(...rates);
  const high = Math.max(...rates);
  return low === high ? formatPercent(low, locale) : `${formatPercent(low, locale)} – ${formatPercent(high, locale)}`;
}

function perks(params: StoreParameters, locale: Locale): Perk[] {
  const t = productMessages[locale].perks;
  const threshold = formatMoneyCompact(params.free_shipping_threshold);
  const havale = rateSpan(params.bank_transfer_tiers, locale);
  // The ciro discount's span, as the homepage's perks bar shows it (StorePerks).
  const volume = rateSpan(params.volume_tiers, locale);
  return [
    {
      Icon: Truck,
      title: t.freeShipping(threshold),
      note: t.freeShippingNote(threshold),
    },
    ...(volume
      ? [
          {
            Icon: ShoppingCart,
            title: t.volume(volume),
            note: t.volumeNote,
          },
        ]
      : []),
    ...(havale
      ? [
          {
            Icon: Landmark,
            title: t.transfer(havale),
            note: t.transferNote,
          },
        ]
      : []),
    ...(params.loyalty.enabled && Number(params.loyalty.base_rate) > 0
      ? [
          {
            Icon: Crown,
            title: t.loyalty,
            note: t.loyaltyNote(
              formatMoneyCompact(params.loyalty.band_min),
              formatMoneyCompact(params.loyalty.band_max),
              formatPercent(params.loyalty.base_rate, locale),
            ),
          },
        ]
      : []),
    // The shop's own promises.
    { Icon: Clock, title: t.courier, note: t.courierNote },
    { Icon: ShieldCheck, title: t.genuine, note: t.genuineNote },
  ];
}

/**
 * The retail buyer's terms, in the space beside the title and the price.
 *
 * Unboxed on purpose: no card, no rule, no tint. Four points sitting on the
 * page beside the price, each far enough from the next to be read as its own
 * reason to buy rather than as a row in a table of terms. The spacing is also
 * what makes the column come out roughly as tall as the brand, title, code,
 * price and stock badge it stands beside.
 *
 * Shown to a bireysel account and to a visitor who has not signed in — someone
 * who would buy at retail if they did. Never to a kafe, a bayi or a toptan
 * account: those buy from their own price list, and `lib/perks` (which mirrors
 * the server's rule) says their discounts are zero by rule. Offering them here
 * would be offering something checkout will not honour.
 */
/**
 * Whether this visitor sees the dock, which the column holding it has to know
 * too: an empty grid cell would leave the title and price squeezed into half
 * the width for a B2B account.
 *
 * `retailPerks` answers false for a guest, because for cart arithmetic a guest
 * has no account. Here a guest counts: they would buy at retail if they signed
 * in, and this is the block that argues they should.
 */
export const showsRetailPerks = (user: Pick<User, "account_type" | "segment_code"> | null) =>
  !user || retailPerks(user);

export function RetailPerks({ params }: { params: StoreParameters }) {
  const user = useAuthStore((s) => s.user);
  const locale = useLocale();
  const t = useMessages(productMessages).perks;
  if (!showsRetailPerks(user)) return null;

  return (
    <aside
      aria-label={t.label}
      className="flex w-full flex-col"
    >
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 sm:mb-4 dark:text-red-400">
        <BadgePercent className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
        {t.heading}
      </p>

      <ul className="space-y-5 sm:space-y-6">
        {perks(params, locale).map(({ Icon, title, note }) => (
          <li key={title} className="flex items-start gap-2.5">
            <Icon
              className="mt-[3px] h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold leading-snug text-neutral-800 dark:text-neutral-200">
                {title}
              </span>
              <span className="mt-0.5 block text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
                {note}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
