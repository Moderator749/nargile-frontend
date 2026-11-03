"use client";

import { BadgePercent, Crown, PiggyBank, type LucideIcon } from "lucide-react";

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
 * bireysel buyer's basket and loyalty pay off — the cart discount, SultanPuan,
 * Kumbara. Havale is left to the price box above, which already gives its
 * price; the installments, the free van and the courier to the homepage and
 * the cart, so the description sits close under the button.
 */
const PRODUCT_PAGE_PERKS = ["volume", "sultanpuan", "kumbara"] as const satisfies readonly AdvantageKey[];
type PerkKey = (typeof PRODUCT_PAGE_PERKS)[number];
const isProductPagePerk = (key: AdvantageKey): key is PerkKey => (PRODUCT_PAGE_PERKS as readonly AdvantageKey[]).includes(key);

/**
 * The shop's basket and loyalty advantages as one row under "Sepete Ekle",
 * each a figure over its name: "%5 – %8 30.000 TL+ / Sepette İndirim",
 * "%10 / SultanPuan Kazanımı", "20.000 TL+ / Kumbara Bonusu", with the live
 * figures of "Parametreler", and only while the homepage shows it. Each leads
 * to its section on "Ayrıcalıklar ve Avantajlar"; its fuller sentence is the
 * link's title.
 *
 * Shown to a bireysel account and to a visitor who has not signed in — never
 * to a kafe, a bayi or a toptan account, whose discounts are zero by rule
 * (`lib/perks`, mirroring the server): offering them here would be offering
 * something checkout will not honour.
 */
export function RetailPerks({ params, sources }: { params: StoreParameters; sources: AdvantageSources }) {
  const user = useAuthStore((s) => s.user);
  const { percent } = useMessages(homeMessages);
  if (!showsRetailPerks(user)) return null;
  const shown = storeAdvantages(sources, params, percent).filter((advantage) => isProductPagePerk(advantage.key));
  return <AdvantageList advantages={shown} />;
}

/**
 * Each perk's mark and colours: the saving green, the crown gold, the piggy
 * bank the shop's red. The badges are solid, each text at 4.5:1 or better on
 * its fill, in both themes.
 */
const PERK_STYLE: Record<PerkKey, { Icon: LucideIcon; icon: string; badge: string }> = {
  volume: {
    Icon: BadgePercent,
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950",
  },
  sultanpuan: {
    Icon: Crown,
    icon: "text-amber-500 dark:text-amber-400",
    badge: "bg-amber-400 text-amber-950 dark:bg-amber-400 dark:text-amber-950",
  },
  kumbara: {
    Icon: PiggyBank,
    icon: "text-red-600 dark:text-red-400",
    badge: "bg-red-600 text-white",
  },
};

const COLUMNS = ["grid-cols-1", "grid-cols-1", "grid-cols-2", "grid-cols-3"] as const;

/** "(30.000 TL+)" → "30.000 TL+": beside a badge, the brackets are noise. */
const bare = (threshold: string | null) => threshold?.replace(/^\((.*)\)$/, "$1") ?? null;

function AdvantageList({ advantages }: { advantages: StoreAdvantage[] }) {
  const t = useMessages(productMessages).perks;
  const shown = advantages.filter((a): a is StoreAdvantage & { key: PerkKey } => isProductPagePerk(a.key) && a.value !== null);
  if (shown.length === 0) return null;

  // One card, its perks in equal cells parted by hairlines. Where the card is
  // wide enough for it (a desktop column, a tablet) each cell sets its icon
  // beside the figure and the name; in a narrower one (a phone, a laptop's
  // two-column page) the icon stands over them, centred.
  return (
    <ul
      aria-label={t.label}
      className={`@container grid ${COLUMNS[shown.length]} divide-x divide-stone-200 rounded-xl border border-stone-200 bg-white py-2.5 shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.04]`}
    >
      {shown.map(({ key, anchor, value, threshold, note }) => {
        const { Icon, icon, badge } = PERK_STYLE[key];
        // Kumbara's figure is where the bonus starts: "20.000 TL+".
        const figure = key === "kumbara" ? `${value}+` : value;
        const from = key === "volume" ? bare(threshold) : null;
        return (
          <li key={key} className="min-w-0 px-2 @xl:px-3">
            <Link
              href={`${PERKS_PAGE.href}#${anchor}`}
              title={[threshold, note].filter(Boolean).join(" ")}
              className="group flex h-full flex-col items-center gap-1.5 rounded-lg text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent @xl:flex-row @xl:items-start @xl:gap-2.5 @xl:text-start"
            >
              <Icon className={`h-5 w-5 shrink-0 @xl:mt-0.5 ${icon}`} strokeWidth={2.25} aria-hidden />
              <span className="flex min-w-0 flex-col items-center gap-0.5 @xl:items-start">
                {/* The badge next to the icon in either direction; a figure itself
                    reads left to right in every language: "20.000 TL+", not "+TL 20.000". */}
                <span className="flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 @xl:justify-start">
                  <span dir="ltr" className={`whitespace-nowrap rounded-md px-2 py-0.5 text-sm font-bold tabular-nums shadow-sm ring-1 ring-inset ring-black/10 ${badge}`}>
                    {figure}
                  </span>
                  {from && <span dir="ltr" className="whitespace-nowrap text-xs font-medium tabular-nums text-stone-500 dark:text-zinc-400">{from}</span>}
                </span>
                <span className="text-[13px] font-medium leading-tight text-stone-800 transition-colors duration-200 group-hover:text-stone-950 sm:text-sm dark:text-zinc-200 dark:group-hover:text-white">
                  {t[key]}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
