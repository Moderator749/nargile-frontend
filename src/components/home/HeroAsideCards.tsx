import type { ComponentType } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { AdvantageFeatures } from "@/components/home/AdvantageFeatures";
import { SultanPuanMark } from "@/components/icons/LoyaltyIcons";
import { InstagramIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import { SmoothAnchor } from "@/components/home/SmoothAnchor";
import { PERKS_PAGE } from "@/lib/bilgi";
import type { PromoBox } from "@/lib/home";
import type { homeMessages } from "@/lib/i18n/messages/home";

/** The words the cards need: the homepage messages of the page's language. */
export type HeroAsideWords = (typeof homeMessages)["tr"];

/**
 * The channels, in order; one without a link in /admin/promos is left out.
 * Each is a small glass tile on the card: its brand's badge, its name and
 * the account's handle.
 */
const CHANNELS: {
  key: "instagram" | "youtube";
  Icon: ComponentType<{ className?: string }>;
  badge: string;
}[] = [
  { key: "instagram", Icon: InstagramIcon, badge: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600" },
  { key: "youtube", Icon: YouTubeIcon, badge: "bg-[#FF0000]" },
];

/** "https://www.instagram.com/sultannargile_bahcelievler" → "@sultannargile_bahcelievler"; null when it names no account. */
function handleOf(href: string): string | null {
  try {
    const first = new URL(href).pathname.split("/").filter(Boolean)[0];
    return first ? `@${first.replace(/^@/, "")}` : null;
  } catch {
    return null;
  }
}

/**
 * A card on a photograph: the picture covers it (public/images/promo, 800px
 * webp), a dark scrim of its own over it keeps the words legible wherever the
 * picture is bright, a light line runs along its top edge, a fine inner ring
 * and a soft drop shadow — rounded as the slider is. Dark in either theme.
 * Its own height below `lg` (where it stands under the slider), half the
 * slider's from `lg`, in the 264px column beside it — hence the tighter
 * padding there.
 */
const CARD = [
  "relative isolate flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-[2rem] bg-[#0d0c10] bg-cover bg-no-repeat p-6 text-white lg:min-h-0 lg:p-5",
  "shadow-[0_18px_40px_-20px_rgb(0_0_0/0.55)] ring-1 ring-inset ring-white/10",
  "before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:z-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/45 before:to-transparent",
].join(" ");
/**
 * Each card's picture, placed so its subject stays in view — the neon
 * Instagram and YouTube signs between the heading and the tiles; the gift
 * box to the right of the words — and the scrim that suits it.
 */
const PHOTO = {
  // The signs are the middle of the picture's upper half (about 24–45% of its
  // height), and the card is near square at every width, so cover could not
  // move them out from under the heading. The picture is the card's width
  // (a square: 100cqw high) and set so the signs' centre (34.5% down) falls
  // 130px from the card's top, between the heading and the tiles; above it,
  // the picture's dark top gives way to the card's own ground under the scrim.
  // On a span of its own: `cqw` is the card's width only inside the card.
  channels: "bg-[url('/images/promo/sosyal.webp')] bg-[length:100%_auto] bg-no-repeat bg-[position:50%_calc(130px-34.5cqw)]",
  advantages: "bg-[url('/images/promo/kazanansizolun.webp')] bg-[position:72%_62%]",
};
const SCRIM = {
  // Dark at the heading and under the tiles, clear across the signs between them.
  channels: "bg-[linear-gradient(180deg,rgb(8_6_14/0.88)_0%,rgb(8_6_14/0.45)_38%,rgb(8_6_14/0.2)_58%,rgb(8_6_14/0.85)_100%)]",
  // Dark down the side the words are on, the gift box lit on the other.
  advantages:
    "bg-[linear-gradient(90deg,rgb(10_8_5/0.9)_0%,rgb(10_8_5/0.7)_45%,rgb(10_8_5/0.15)_100%),linear-gradient(180deg,rgb(10_8_5/0.55)_0%,transparent_35%,transparent_65%,rgb(10_8_5/0.75)_100%)]",
};
/** The scrim, between the picture and the card's words. */
function Scrim({ className }: { className: string }) {
  return <span aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${className}`} />;
}
/** A soft shadow under the words: legible on the brightest part of either picture. */
const LIFT = "[text-shadow:0_1px_10px_rgb(0_0_0/0.55)]";
const OVERLINE = `text-[10.5px] font-bold uppercase tracking-[0.2em] lg:tracking-[0.14em] ${LIFT}`;
const TITLE = `text-balance text-[1.375rem] font-extrabold leading-[1.15] tracking-tight text-white ${LIFT}`;

/**
 * Where the advantages box leads: its own link, unless that is empty or the
 * homepage's old "#avantajlar" section (the advantages grid, since removed) —
 * then "Ayrıcalıklar ve Avantajlar", which says it all.
 */
function advantagesHref(href: string | null | undefined): string {
  const link = href?.trim();
  return !link || /^\/?#avantajlar$/.test(link) ? PERKS_PAGE.href : link;
}

/** The community card: the shop's channels as two glass tiles. */
export function ChannelsCard({ box, t }: { box?: PromoBox; t: HeroAsideWords }) {
  const widget = box?.widget;
  const channels = CHANNELS.flatMap(({ key, ...channel }) => {
    const href = widget?.[`${key}_href`];
    return href ? [{ key, href, label: widget![`${key}_label`] || key, handle: handleOf(href), ...channel }] : [];
  });
  return (
    // A phone's card is as high as its words: some more height there keeps the signs in view between them.
    <div className={`${CARD} [container-type:inline-size] max-sm:min-h-[290px]`}>
      {/* Faded in from the top, so where the picture starts below the card's edge shows no seam. */}
      <span aria-hidden className={`pointer-events-none absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent,black_80px)] ${PHOTO.channels}`} />
      <Scrim className={SCRIM.channels} />
      <div>
        <p className={`${OVERLINE} text-white/75`}>{box?.text || t.followUs}</p>
        <h2 className={`${TITLE} mt-1.5`}>{box?.topTitle || t.aside.channelsTitle}</h2>
        {/* The signs in the picture say it to the eye; the line stays for a screen reader. */}
        <p className="sr-only">{t.aside.channelsNote}</p>
      </div>
      {channels.length > 0 && (
        <ul className={`mt-auto grid gap-2 pt-4 ${channels.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {channels.map(({ key, href, label, handle, Icon, badge }) => (
            <li key={key} className="min-w-0">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group/channel flex h-full flex-col gap-2 rounded-2xl bg-black/35 p-3 ring-1 ring-inset ring-white/15 backdrop-blur-md transition-colors duration-200 hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="flex items-center justify-between">
                  <span aria-hidden className={`flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-md shadow-black/30 ${badge}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 text-white/45 transition-transform group-hover/channel:text-white motion-safe:group-hover/channel:-translate-y-0.5 motion-safe:group-hover/channel:translate-x-0.5 rtl:-scale-x-100"
                    aria-hidden
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{label}</span>
                  {/* Under the slider there is room for the whole handle; in the narrow column beside it, only the name. */}
                  {handle && <span className="block truncate text-[11px] text-white/55 lg:hidden">{handle}</span>}
                </span>
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
      className={`group ${CARD} ${PHOTO.advantages} transition-shadow duration-300 hover:shadow-[0_22px_48px_-18px_rgb(0_0_0/0.65)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <Scrim className={SCRIM.advantages} />
      <p className={`${OVERLINE} flex items-center gap-2 text-amber-300`}>
        <SultanPuanMark className="h-6 w-6 shrink-0 drop-shadow-[0_2px_4px_rgb(120_53_15/0.45)]" />
        <span className="min-w-0 truncate">{eyebrow}</span>
      </p>
      <h2 className={`${TITLE} mt-2.5`}>{box?.title || t.aside.advantagesTitle}</h2>
      {/* The admin's line where there is room for it: under the slider, not in the narrow column. */}
      <p className={`mt-1.5 max-w-[34ch] text-[13px] leading-snug text-white/80 lg:hidden ${LIFT}`}>{box?.bottomText || t.aside.advantagesText}</p>
      <div className={`mt-3 mb-4 ${LIFT}`}>
        <AdvantageFeatures />
      </div>
      <span className="mt-auto flex h-10 w-full items-center justify-between gap-2 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 ps-4 pe-1 text-sm font-bold text-amber-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] transition-[filter] group-hover:brightness-105">
        {box?.widget?.anchor_label || t.aside.advantagesLink}
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-950 text-amber-200">
          <ArrowRight className="h-4 w-4 transition-transform rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5" />
        </span>
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
