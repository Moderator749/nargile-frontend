import type { ComponentType } from "react";
import { ArrowRight, Crown } from "lucide-react";

import { InstagramIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import { SmoothAnchor } from "@/components/home/SmoothAnchor";
import { PERKS_PAGE } from "@/lib/bilgi";
import type { PromoBox } from "@/lib/home";
import type { homeMessages } from "@/lib/i18n/messages/home";

/** The words the cards need: the homepage messages of the page's language. */
export type HeroAsideWords = (typeof homeMessages)["tr"];

/**
 * The channels, in order; one without a link in /admin/promos is left out.
 * Dark buttons on the light card, the glyph in its brand's colour; the whole
 * button takes the brand's colours on hover.
 */
const CHANNELS: {
  key: "instagram" | "youtube";
  Icon: ComponentType<{ className?: string }>;
  tone: string;
  glyph: string;
}[] = [
  {
    key: "instagram",
    Icon: InstagramIcon,
    tone: "hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 focus-visible:outline-pink-500",
    glyph: "text-pink-400",
  },
  {
    key: "youtube",
    Icon: YouTubeIcon,
    tone: "hover:bg-[#FF0000] focus-visible:outline-red-500",
    glyph: "text-red-500",
  },
];

/**
 * A card in words only: a soft cream ground under dark type, rounded as the
 * slider beside it is, a hairline and a light shadow to lift it off the page.
 * In the dark theme the cream turns to a deep stone so it does not glare.
 * Its own height below `lg` (where it stands under the slider), half the
 * slider's from `lg`, in the 264px column beside it — hence the tighter
 * padding there.
 *
 * The photographs the cards once stood on ("Promo Kutusu" photos and shades)
 * are no longer drawn: the cards are type and icons alone.
 */
const CARD =
  "relative isolate flex min-h-[200px] flex-1 flex-col justify-between overflow-hidden rounded-[2rem] border border-stone-200/80 bg-gradient-to-br from-[#FBFAF6] via-[#F7F4EC] to-[#EFE9DC] p-6 text-gray-900 shadow-sm lg:min-h-0 lg:p-5 dark:border-white/10 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 dark:text-stone-100";
const OVERLINE = "text-[11px] font-semibold uppercase tracking-[0.2em] lg:tracking-[0.12em]";
const TITLE = "mt-1.5 text-balance text-xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white";

/**
 * Where the advantages box leads: its own link, unless that is empty or the
 * homepage's old "#avantajlar" section (the advantages grid, since removed) —
 * then "Ayrıcalıklar ve Avantajlar", which says it all.
 */
function advantagesHref(href: string | null | undefined): string {
  const link = href?.trim();
  return !link || /^\/?#avantajlar$/.test(link) ? PERKS_PAGE.href : link;
}

/** The community card: the shop's channels, on its photograph. */
export function ChannelsCard({ box, t }: { box?: PromoBox; t: HeroAsideWords }) {
  const widget = box?.widget;
  const channels = CHANNELS.flatMap(({ key, ...channel }) => {
    const href = widget?.[`${key}_href`];
    return href ? [{ key, href, label: widget![`${key}_label`] || key, ...channel }] : [];
  });
  return (
    <div className={CARD}>
      <div>
        <p className={`${OVERLINE} text-stone-500 dark:text-stone-400`}>{box?.text || t.followUs}</p>
        <h2 className={TITLE}>{box?.topTitle || t.aside.channelsTitle}</h2>
      </div>
      {/* One under the other in the narrow column, where side by side the
          labels would be cut short. */}
      {channels.length > 0 && (
        <ul className="mt-4 flex gap-2 lg:flex-col">
          {channels.map(({ key, href, label, Icon, tone, glyph }) => (
            <li key={key} className="min-w-0 flex-1 lg:flex-none">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group/channel flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-white/10 ${tone}`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors group-hover/channel:text-white ${glyph}`} />
                <span className="truncate">{label}</span>
                <span className="sr-only">{t.newTab}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The advantages card: the whole card is the link to them. */
export function AdvantagesCard({ box, t }: { box?: PromoBox; t: HeroAsideWords }) {
  // The admin types the dots into the eyebrow; the overline has none.
  const eyebrow = box?.eyebrow.replace(/^[•·\s]+|[•·\s]+$/g, "") || t.aside.advantagesEyebrow;
  return (
    <SmoothAnchor
      href={advantagesHref(box?.href)}
      className={`group ${CARD} transition-shadow duration-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <div>
        {/* A small crown in bronze over the overline: the programme's mark, no photograph. */}
        <span
          aria-hidden
          className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 shadow-sm ring-1 ring-amber-500/30 lg:mb-2.5 lg:h-7 lg:w-7"
        >
          <Crown className="h-4 w-4 lg:h-3.5 lg:w-3.5" strokeWidth={2.25} />
        </span>
        <p className={`${OVERLINE} text-amber-800 dark:text-amber-300`}>{eyebrow}</p>
        <h2 className={TITLE}>{box?.title || t.aside.advantagesTitle}</h2>
        <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-gray-600 lg:text-[13px] lg:leading-snug dark:text-stone-300">
          {box?.bottomText || t.aside.advantagesText}
        </p>
      </div>
      <span className="mt-4 inline-flex w-max items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:group-hover:bg-stone-200">
        {box?.widget?.anchor_label || t.aside.advantagesLink}
        <ArrowRight
          className="h-4 w-4 transition-transform rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5"
          aria-hidden
        />
      </span>
    </SmoothAnchor>
  );
}

/**
 * The two cards beside the hero: the shop's channels above, the advantages
 * below (ChannelsCard, AdvantagesCard — which /admin/promos previews one by
 * one, each under its own fields). Both read the one promo box: its texts and
 * links; without one they keep their own copy and the channels are left out.
 *
 * Below `lg` they stand under the slider, side by side from `sm` and stacked on
 * a phone, so a small screen keeps the channels and the way to the advantages.
 * From `lg` they are stacked beside it to its height, in the 264px the closed
 * category column leaves, and only while it is closed: opening the column
 * folds this column away (the row's grid takes its width to 0) and the cards
 * fade out with it, while the slider keeps its size (see the homepage).
 *
 * `h-0 min-h-full`: from `lg` the column takes the slider's height and gives
 * the row none of its own — folded to no width, its text would otherwise stand
 * a letter wide and stretch the slider down the page.
 */
export function HeroAsideCards({
  box,
  t,
  className = "",
}: {
  box?: PromoBox;
  t: HeroAsideWords;
  className?: string;
}) {
  return (
    <aside
      aria-label={t.highlights}
      // The floating WhatsApp button steps aside while it would cover these cards.
      data-float-clear=""
      className={`mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:invisible lg:mt-0 lg:flex lg:h-0 lg:min-h-full lg:flex-col lg:overflow-hidden lg:opacity-0 lg:transition-[opacity,visibility] lg:duration-300 motion-reduce:transition-none lg:sidebar-closed:visible lg:sidebar-closed:opacity-100 ${className}`}
    >
      <ChannelsCard box={box} t={t} />
      <AdvantagesCard box={box} t={t} />
    </aside>
  );
}
