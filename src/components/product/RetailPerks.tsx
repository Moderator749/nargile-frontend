"use client";

import { BadgePercent } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { PERKS_PAGE } from "@/lib/bilgi";
import { homeMessages } from "@/lib/i18n/messages/home";
import { productMessages } from "@/lib/i18n/messages/product";
import { retailPerks } from "@/lib/perks";
import { storeAdvantages, type AdvantageSources } from "@/lib/storeAdvantages";
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
 * "Size Özel Alışveriş Avantajları": the shop's advantages exactly as the
 * homepage states them (`storeAdvantages`) — the Avantaj Çubuğu's three, the
 * free shipping van, the courier, the SultanPuan and Kumbara bands — in their
 * words from "Ana Sayfa Düzenleme" and with the live figures of
 * "Parametreler"; one the homepage does not show is not here either. Each
 * leads to its section on "Ayrıcalıklar ve Avantajlar".
 *
 * Unboxed on purpose: no card, no rule, no tint, beside the title and price.
 * Shown to a bireysel account and to a visitor who has not signed in — never
 * to a kafe, a bayi or a toptan account, whose discounts are zero by rule
 * (`lib/perks`, mirroring the server): offering them here would be offering
 * something checkout will not honour.
 */
export function RetailPerks({ params, sources }: { params: StoreParameters; sources: AdvantageSources }) {
  const user = useAuthStore((s) => s.user);
  const t = useMessages(productMessages).perks;
  const { percent } = useMessages(homeMessages);
  if (!showsRetailPerks(user)) return null;
  const advantages = storeAdvantages(sources, params, percent);
  if (advantages.length === 0) return null;

  return (
    <aside aria-label={t.label} className="flex w-full flex-col">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 sm:mb-4 dark:text-red-400">
        <BadgePercent className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
        {t.heading}
      </p>

      <ul className="space-y-3.5 sm:space-y-4">
        {advantages.map(({ key, anchor, Icon, label, value, note }) => (
          <li key={key}>
            <Link
              href={`${PERKS_PAGE.href}#${anchor}`}
              className="group flex items-start gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Icon className="mt-[3px] h-4 w-4 shrink-0 text-red-600 dark:text-red-400" strokeWidth={1.75} aria-hidden />
              <span className="min-w-0">
                <span className="block text-[11px] font-bold leading-snug text-neutral-800 transition-colors group-hover:text-red-700 dark:text-neutral-200 dark:group-hover:text-red-400">
                  {label}
                  {value && <span className="text-red-600 dark:text-red-400"> {value}</span>}
                </span>
                <span className="mt-0.5 block text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">{note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
