import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bike, Crown, CreditCard, Landmark, Layers, PiggyBank, Truck, type LucideIcon } from "lucide-react";

import { BilgiLayout } from "@/components/bilgi/BilgiLayout";
import { BILGI_HREF, perksPage } from "@/lib/bilgi";
import type { Locale } from "@/lib/i18n/config";
import { bilgiMessages, perksMessages } from "@/lib/i18n/messages/info";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { getStoreParameters } from "@/lib/server/catalog";
import { formatRate } from "@/lib/storeParameters";
import type { ParameterTier, StoreParameters } from "@/types";

// Rendered per request, from parameters read fresh each time
// (getStoreParameters): a change in "Parametreler" — saved in the panel or
// not — shows on the next visit. Neither the render nor the read is cached,
// so the page makes no ISR writes.
export const revalidate = 0;

/** "3000.00" → "3.000 TL", "29999.99" → "29.999,99 TL" — in every language, as the prices are. */
const tl = (amount: string | number) =>
  `${Number(amount).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL`;

type PerksWords = (typeof perksMessages)["tr"];

/**
 * A message's `**…**` as <strong>: the perks mark their figures that way, so
 * each language can put the bold where its word order puts the figure.
 */
function rich(text: string): ReactNode {
  const parts = text.split("**");
  if (parts.length === 1) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

/**
 * A discount ladder as sentences, lowest rung first: each rung up to the next
 * one's threshold less a kuruş, the last "and above". Rungs that give nothing
 * are left out.
 */
function ladder(
  tiers: ParameterTier[],
  m: PerksWords,
  locale: Locale,
  line: (range: string, rate: string, last: boolean) => string,
): ReactNode[] {
  const live = tiers.filter((t) => Number(t.rate) > 0).sort((a, b) => Number(a.threshold) - Number(b.threshold));
  return live.map((tier, i) => {
    const next = live[i + 1];
    const range = next
      ? m.range(tl(tier.threshold), tl(Number(next.threshold) - 0.01))
      : m.rangeFrom(tl(tier.threshold));
    return rich(line(range, formatRate(tier.rate, locale), !next));
  });
}

interface Perk {
  id: string;
  Icon: LucideIcon;
  title: string;
  points: ReactNode[];
  /** Fine print under the points, in its own quiet box. */
  note?: ReactNode;
}

/**
 * Everything the page states, from the rules checkout applies (`params`), in
 * the page's language. The ids stay Turkish: they are the anchors the
 * homepage and the footer link to (…#sultanpuan).
 */
function perks(params: StoreParameters, m: PerksWords, locale: Locale): Perk[] {
  const rate = (value: string | number) => formatRate(value, locale);
  const threshold = tl(params.free_shipping_threshold);
  const coalRatio = rate(params.coal_max_ratio);
  const byQuantity = params.coal_rule_basis === "quantity";
  const coalMinimum = byQuantity ? m.pieces(params.coal_min_quantity) : m.kilos(Number(params.coal_min_kg));
  const { loyalty } = params;
  const volume = ladder(params.volume_tiers, m, locale, m.volumeLine);
  const transfer = ladder(params.bank_transfer_tiers, m, locale, (range, r) => m.transferLine(range, r));
  const bonusRate =
    loyalty.annual_bonus_points > 0 && Number(loyalty.annual_spend_threshold) > 0
      ? rate((loyalty.annual_bonus_points * Number(loyalty.conversion_rate)) / Number(loyalty.annual_spend_threshold))
      : null;
  // The orders KumbaraPuan counts: those under the ceiling, or all of them.
  const ceiling = Number(loyalty.annual_order_ceiling) > 0 ? tl(loyalty.annual_order_ceiling) : null;

  return [
    {
      id: "ucretsiz-kargo",
      Icon: Truck,
      title: m.shippingTitle,
      points: [
        rich(m.shippingThreshold(threshold)),
        rich(m.shippingCoal(coalRatio, coalMinimum)),
        rich(m.shippingMixed(coalRatio, byQuantity, threshold)),
      ],
      note: m.shippingNote,
    },
    {
      id: "istanbul-kurye",
      Icon: Bike,
      title: m.courierTitle,
      points: [m.courierUrgent, m.courierStores, rich(m.courierHours)],
      note: m.courierNote,
    },
    {
      id: "taksit",
      Icon: CreditCard,
      title: m.instalmentTitle,
      points: [rich(m.instalmentCards), m.instalmentMore],
    },
    ...(volume.length > 0
      ? [
          {
            id: "sepet-indirimi",
            Icon: Layers,
            title: m.volumeTitle,
            points: volume,
            note: m.volumeNote,
          },
        ]
      : []),
    ...(transfer.length > 0
      ? [
          {
            id: "havale-indirimi",
            Icon: Landmark,
            title: m.transferTitle,
            points: transfer,
            note: volume.length > 0 ? m.transferNote : undefined,
          },
        ]
      : []),
    ...(loyalty.enabled && Number(loyalty.base_rate) > 0
      ? [
          {
            id: "sultanpuan",
            Icon: Crown,
            title: m.sultanTitle(rate(loyalty.base_rate)),
            points: [
              rich(m.sultanEarn(tl(loyalty.band_min), tl(loyalty.band_max), rate(loyalty.base_rate))),
              m.sultanSpend(tl(loyalty.conversion_rate)),
              // A point's life in the wallet (`app/services/wallet.py`, POINT_LIFETIME): a year.
              m.sultanLifetime,
            ],
          },
        ]
      : []),
    ...(loyalty.enabled && bonusRate
      ? [
          {
            id: "kumbarapuan",
            Icon: PiggyBank,
            title: m.kumbaraTitle(bonusRate),
            points: [
              rich(
                m.kumbaraEarn(
                  ceiling,
                  loyalty.annual_period_days,
                  tl(loyalty.annual_spend_threshold),
                  loyalty.annual_bonus_points,
                  bonusRate,
                ),
              ),
              m.kumbaraSpend,
            ],
          },
        ]
      : []),
  ];
}

export async function generateMetadata(): Promise<Metadata> {
  const [params, { locale }] = await Promise.all([getStoreParameters(), getI18n()]);
  const page = perksPage(locale);
  return pageMetadata({
    title: page.title,
    description: perksMessages[locale].metaDescription(tl(params.free_shipping_threshold)),
    href: page.href,
    locale,
    locales: "all",
  });
}

/**
 * "Ayrıcalıklar ve Avantajlar": every retail perk on one page, each its own
 * section card — a number, an icon, an <h2>, the points and any fine print.
 * Linked from the footer's Bilgi Sayfaları column and listed on /bilgi.
 *
 * The figures are the ones checkout applies, read from "Parametreler"
 * (`getStoreParameters`), so the page cannot promise a threshold or a rate
 * the cart does not honour; a rule the panel switches off (Sultan Puan, a
 * ladder with no rungs) drops its section. The courier and the instalments
 * are the shop's own terms, stated as written. Each section has an id, so a
 * perk can be linked to directly (…#sultanpuan).
 */
export default async function PerksPage() {
  const [params, { locale, t }] = await Promise.all([getStoreParameters(), getI18n()]);
  const m = perksMessages[locale];
  const page = perksPage(locale);
  const list = perks(params, m, locale);

  return (
    <BilgiLayout
      title={page.title}
      breadcrumbs={[
        { name: t.nav.crumbHome, href: "/" },
        { name: bilgiMessages[locale].title, href: BILGI_HREF },
        { name: page.title, href: page.href },
      ]}
    >
      <p className="max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">{m.intro}</p>

      {/* The perks at a glance: each a link to its card. */}
      <nav aria-label={m.navLabel} className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {list.map(({ id, title }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-flex rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors duration-200 hover:border-red-300 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-red-400/50 dark:hover:text-red-400"
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 space-y-5">
        {list.map(({ id, Icon, title, points, note }, i) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-baslik`}
            className="scroll-mt-[calc(var(--header-height,4rem)+1.5rem)] rounded-2xl border border-neutral-200 bg-white p-6 transition-colors duration-200 hover:border-red-200 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-red-400/30"
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20"
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-neutral-400 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 id={`${id}-baslik`} className="mt-0.5 text-lg font-bold tracking-tight text-neutral-900 sm:text-xl dark:text-white">
                  {title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {points.map((point, j) => (
                    <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300 [&_strong]:font-semibold [&_strong]:text-neutral-900 dark:[&_strong]:text-white">
                      <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {note && (
                  <p className="mt-5 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600 dark:bg-white/[0.03] dark:text-neutral-400">
                    {note}
                  </p>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </BilgiLayout>
  );
}
