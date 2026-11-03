"use client";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { PERKS_PAGE } from "@/lib/bilgi";
import { homeMessages } from "@/lib/i18n/messages/home";
import { productMessages } from "@/lib/i18n/messages/product";
import { retailPerks } from "@/lib/perks";
import { storeAdvantages, type AdvantageKey, type AdvantageSources, type StoreAdvantage } from "@/lib/storeAdvantages";
import { useAuthStore } from "@/store/useAuthStore";
import type { StoreParameters, User } from "@/types";

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

/**
 * The ones a product page states. Of the homepage's advantages, the ways a
 * bireysel buyer's payment and loyalty pay off — havale, SultanPuan, Kumbara;
 * the installments, the volume discount, the free van and the courier are left
 * to the homepage and the cart, so the description sits close under the button.
 */
const PRODUCT_PAGE_PERKS: readonly AdvantageKey[] = ["transfer", "sultanpuan", "kumbara"];

/**
 * The shop's payment and loyalty advantages as one line under "Sepete Ekle":
 * "Havale & EFT %5 – %7 | SultanPuan %10 | Kumbara 20.000 TL", each in the
 * homepage's words (`storeAdvantages`) with the live figures of "Parametreler",
 * and only while the homepage shows it. Each leads to its section on
 * "Ayrıcalıklar ve Avantajlar"; its fuller sentence is the link's title.
 *
 * Shown to a bireysel account and to a visitor who has not signed in — never
 * to a kafe, a bayi or a toptan account, whose discounts are zero by rule
 * (`lib/perks`, mirroring the server): offering them here would be offering
 * something checkout will not honour. Such an account sees `TransferPerk`
 * instead, where the product gives its list the havale discount.
 */
export function RetailPerks({ params, sources }: { params: StoreParameters; sources: AdvantageSources }) {
  const user = useAuthStore((s) => s.user);
  const { percent } = useMessages(homeMessages);
  if (!showsRetailPerks(user)) return null;
  const shown = storeAdvantages(sources, params, percent).filter((advantage) => PRODUCT_PAGE_PERKS.includes(advantage.key));
  return <AdvantageList advantages={shown} />;
}

/**
 * A firm's account (kafe, bayi, toptan) on a product whose switch gives its
 * list the havale discount (`segment_havale`): of the advantages, that one
 * alone — the others are retail offers checkout will not honour for it. The
 * Avantaj Çubuğu's own words and the live tiers of "Parametreler", as the
 * retail list states it, whether or not the homepage shows the bar.
 */
export function TransferPerk({ params, sources }: { params: StoreParameters; sources: AdvantageSources }) {
  const { percent } = useMessages(homeMessages);
  const transfer = storeAdvantages({ ...sources, sections: { ...sources.sections, perks: true } }, params, percent).filter(
    (advantage) => advantage.key === "transfer",
  );
  return <AdvantageList advantages={transfer} />;
}

function AdvantageList({ advantages }: { advantages: StoreAdvantage[] }) {
  const t = useMessages(productMessages).perks;
  if (advantages.length === 0) return null;

  // One line, the items parted by a hairline. On a phone the line is three
  // equal columns, each name over its figure, so it never wraps mid-row and
  // leaves a divider at the start of a line.
  return (
    <ul aria-label={t.label} className="grid grid-cols-3 text-xs leading-5 sm:flex sm:flex-wrap sm:items-center sm:gap-y-1.5">
      {advantages.map(({ key, anchor, label, value, threshold, note }) => (
        <li key={key} className="min-w-0 border-s border-border px-2.5 first:border-s-0 first:ps-0">
          <Link
            href={`${PERKS_PAGE.href}#${anchor}`}
            title={[threshold, note].filter(Boolean).join(" ")}
            className="group flex flex-col rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:block sm:whitespace-nowrap"
          >
            <span className="font-semibold text-neutral-700 transition-colors duration-200 group-hover:text-red-700 dark:text-neutral-300 dark:group-hover:text-red-400">
              {label}
            </span>
            {value && <span className="font-semibold tabular-nums text-red-600 sm:ms-1 dark:text-red-400">{value}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
