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
 * bireysel buyer's payment and loyalty pay off — havale, SultanPuan, Kumbara;
 * the installments, the volume discount, the free van and the courier are left
 * to the homepage and the cart, so the description sits close under the button.
 */
const PRODUCT_PAGE_PERKS = ["transfer", "sultanpuan", "kumbara"] as const satisfies readonly AdvantageKey[];
const isProductPagePerk = (key: AdvantageKey): key is PerkKey => (PRODUCT_PAGE_PERKS as readonly AdvantageKey[]).includes(key);

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
  const shown = storeAdvantages(sources, params, percent).filter((advantage) => isProductPagePerk(advantage.key));
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

type PerkKey = (typeof PRODUCT_PAGE_PERKS)[number];

/** Each perk's mark and tint: the saving green, the crown gold, the piggy bank the shop's red. */
const PERK_STYLE: Record<PerkKey, { Icon: LucideIcon; icon: string; badge: string }> = {
  transfer: {
    Icon: BadgePercent,
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  },
  sultanpuan: {
    Icon: Crown,
    icon: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  },
  kumbara: {
    Icon: PiggyBank,
    icon: "text-red-600 dark:text-red-400",
    badge: "bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20",
  },
};

const COLUMNS = ["grid-cols-1", "grid-cols-1", "grid-cols-2", "grid-cols-3"] as const;

function AdvantageList({ advantages }: { advantages: StoreAdvantage[] }) {
  const t = useMessages(productMessages).perks;
  const shown = advantages.filter((a): a is StoreAdvantage & { key: PerkKey } => isProductPagePerk(a.key) && a.value !== null);
  if (shown.length === 0) return null;

  // One strip: the perks side by side across it from `sm`; on a phone as many
  // equal micro-cards, icon over words, parted by hairlines.
  return (
    <ul
      aria-label={t.label}
      className={`grid ${COLUMNS[shown.length]} divide-x divide-stone-200/70 rounded-lg border border-stone-200/70 bg-stone-50/80 py-2 rtl:divide-x-reverse sm:flex sm:items-center sm:justify-between sm:gap-3 sm:divide-x-0 sm:px-3 dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.03]`}
    >
      {shown.map(({ key, anchor, value, threshold, note }) => {
        const { Icon, icon, badge } = PERK_STYLE[key];
        const [before, after] = t[key];
        // Kumbara's figure is where the bonus starts: "20.000 TL+".
        const figure = key === "kumbara" ? `${value}+` : value;
        return (
          <li key={key} className="min-w-0 px-1.5 sm:px-0">
            <Link
              href={`${PERKS_PAGE.href}#${anchor}`}
              title={[threshold, note].filter(Boolean).join(" ")}
              className="group flex flex-col items-center gap-1 rounded-md text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-row sm:gap-2 sm:text-start"
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${icon}`} strokeWidth={2} aria-hidden />
              <span className="text-[11px] font-medium leading-snug text-stone-700 transition-colors duration-200 group-hover:text-stone-950 dark:text-zinc-300 dark:group-hover:text-white">
                {before}
                {/* A figure reads left to right in every language: "20.000 TL+", not "+TL 20.000". */}
                <span dir="ltr" className={`mx-0.5 inline-block whitespace-nowrap rounded px-1 font-semibold tabular-nums ring-1 ring-inset ${badge}`}>
                  {figure}
                </span>
                {after}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
