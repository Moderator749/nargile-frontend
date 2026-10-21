"use client";

import { CreditCard, ShoppingCart, TrendingDown, type LucideIcon } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useShippingPerks } from "@/hooks/useShippingPerks";
import { useStoreParameters } from "@/hooks/useStoreParameters";
import { PERKS_PAGE } from "@/lib/bilgi";
import { homeMessages } from "@/lib/i18n/messages/home";
import { PAGE_CONTAINER } from "@/lib/layout";
import type { ParameterTier } from "@/types";

/**
 * "%5 – %8": a ladder's lowest and highest rate that give anything; null with
 * none. Written as formatRate would, in the page's language ("5% – 8%").
 */
function rateSpan(tiers: ParameterTier[], percent: (n: number) => string): string | null {
  const rates = tiers.map((t) => Number(t.rate)).filter((r) => r > 0);
  if (rates.length === 0) return null;
  const low = Math.min(...rates);
  const high = Math.max(...rates);
  const rate = (r: number) => percent(r * 100);
  return low === high ? rate(low) : `${rate(low)} – ${rate(high)}`;
}

interface Perk {
  /** Its section on the perks page. */
  anchor: string;
  Icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}

/**
 * The store's three payment advantages as a quiet bar under the hero row,
 * over "Sizin İçin Seçtiklerimiz": no cards, no borders, no fills — an icon in the
 * shop's red, a small label in the same red, the figure in bold and a line under it, three
 * across from `md` with hairlines between them (the icon over the words on a
 * tablet, beside them from `lg`), one under another below.
 * Each is a link to its section on "Ayrıcalıklar ve Avantajlar".
 *
 * The discount ranges are the live ladders from "Parametreler" (what checkout
 * applies); a ladder the panel empties drops its item. They are retail
 * promises, so the bar is left out for a signed-in B2B account
 * (`useShippingPerks`), as the SultanPuan and Kumbara bands are.
 */
export function StorePerks() {
  const { show } = useShippingPerks();
  const params = useStoreParameters();
  const t = useMessages(homeMessages);
  if (!show) return null;

  const volume = rateSpan(params.volume_tiers, t.percent);
  const transfer = rateSpan(params.bank_transfer_tiers, t.percent);
  const perks: Perk[] = [
    {
      anchor: "taksit",
      Icon: CreditCard,
      label: t.perks.installmentsLabel,
      value: t.perks.installmentsValue,
      note: t.perks.installmentsNote,
    },
    ...(volume
      ? [
          {
            anchor: "sepet-indirimi",
            Icon: ShoppingCart,
            label: t.perks.volumeLabel,
            value: volume,
            note: t.perks.volumeNote,
          },
        ]
      : []),
    ...(transfer
      ? [
          {
            anchor: "havale-indirimi",
            Icon: TrendingDown,
            label: t.perks.transferLabel,
            value: transfer,
            note: t.perks.transferNote,
          },
        ]
      : []),
  ];

  return (
    <section aria-labelledby="magaza-avantajlari-baslik" className="bg-white pt-8 pb-4 md:pt-10 dark:bg-transparent">
      <h2 id="magaza-avantajlari-baslik" className="sr-only">
        {t.perks.heading}
      </h2>
      <ul
        className={`${PAGE_CONTAINER} flex flex-col gap-8 md:grid md:gap-0 md:divide-x md:divide-neutral-200 dark:md:divide-white/10 ${
          perks.length === 3 ? "md:grid-cols-3" : perks.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1"
        }`}
      >
        {perks.map(({ anchor, Icon, label, value, note }) => (
          <li key={anchor} className="md:px-6 md:first:ps-0 md:last:pe-0 lg:px-10">
            <Link
              href={`${PERKS_PAGE.href}#${anchor}`}
              // The icon beside the words, but over them on a tablet, where a
              // third of the row is too narrow for a label beside an icon.
              className="group flex items-start gap-4 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:flex-col md:gap-3 lg:flex-row lg:gap-4"
            >
              <Icon
                className="mt-0.5 h-7 w-7 shrink-0 text-red-600 transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-0.5 dark:text-red-400"
                strokeWidth={1.5}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.22em] text-red-600 dark:text-red-400">
                  {label}
                </span>
                {/* Two lines kept for the figure from md to xl, where "Peşin fiyatına
                    3 taksit" needs them, so the three lines under the figures
                    start level; one from xl, where every figure fits. */}
                <span className="mt-1 block text-balance text-2xl font-extrabold tracking-tight text-neutral-900 tabular-nums transition-colors duration-200 group-hover:text-red-700 md:min-h-[2lh] xl:min-h-0 dark:text-white dark:group-hover:text-red-400">
                  {value}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
