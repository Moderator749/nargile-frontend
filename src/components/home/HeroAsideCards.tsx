import type { ComponentType } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { InstagramIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import { SmoothAnchor } from "@/components/home/SmoothAnchor";
import { PERKS_PAGE } from "@/lib/bilgi";
import { canOptimiseImage, type CardPhoto, type PromoBox } from "@/lib/home";
import type { homeMessages } from "@/lib/i18n/messages/home";
import type { PromoShade } from "@/types";

/** The words the cards need: the homepage messages of the page's language. */
export type HeroAsideWords = (typeof homeMessages)["tr"];

/**
 * The channels, in order; one without a link in /admin/promos is left out.
 * Glass on the photograph at rest, with the glyph in its brand's colour; the
 * whole button takes the brand's colours on hover.
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
    tone: "hover:border-transparent hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 focus-visible:outline-pink-400",
    glyph: "text-pink-400",
  },
  {
    key: "youtube",
    Icon: YouTubeIcon,
    tone: "hover:border-transparent hover:bg-[#FF0000] focus-visible:outline-red-400",
    glyph: "text-red-500",
  },
];

/**
 * The shop's own photographs (also on the advantage tiles), dark and red:
 * accessories, and an ornate set. Neither carries another brand's name, as the
 * Legend and Oduman shots do — the advantages card speaks for Sultan Nargile.
 * The set stands on the left of its frame, so it is mirrored to clear the words.
 * In Arabic the words are at the right, so each photo is mirrored the other
 * way round (the set no longer, the accessories now), and the veil with them.
 */
const BACKDROPS = {
  channels: { src: "/images/avantaj-hero-3.jpg" },
  advantages: { src: "/images/avantaj-hero-1.jpg", flip: true },
};

/**
 * A card on a photograph: dark in either theme, as the slider beside it is.
 * Its own height below `lg` (where it stands under the slider), half the
 * slider's from `lg`, in the 264px column beside it — hence the tighter
 * padding there. The hairline is drawn over the photograph, which would
 * otherwise cover a ring on the card itself.
 */
const CARD = [
  "relative isolate flex min-h-[200px] flex-1 flex-col justify-between overflow-hidden rounded-2xl bg-neutral-950 p-6 shadow-sm lg:min-h-0 lg:p-5",
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-inset after:ring-white/10",
].join(" ");
const OVERLINE = "text-xs font-bold uppercase tracking-widest";

/**
 * "Gölge Yönü": where the veil is darkest. From the left is the look the cards
 * always had — the words are at the start — and, like the words, it changes
 * sides in Arabic; from the top or the bottom it stays put. Whole class names,
 * so Tailwind finds them.
 */
const VEIL: Record<PromoShade, string> = {
  left: "bg-gradient-to-r rtl:bg-gradient-to-l",
  right: "bg-gradient-to-l rtl:bg-gradient-to-r",
  top: "bg-gradient-to-b",
  bottom: "bg-gradient-to-t",
};
const TITLE = "mt-1.5 text-balance text-xl font-extrabold leading-tight text-white";

/**
 * The photograph behind a card, under a veil that is darkest where `shade`
 * says (the start, where the words are, unless the admin chose otherwise) and
 * clears towards the subject.
 *
 * The shop's own photo is mirrored as BACKDROPS says; one the admin chose
 * ("Promo Kutusu") is shown as it is, cropped where its focus says.
 */
function Backdrop({
  src,
  flip,
  zoom,
  photo,
  shade = "left",
}: {
  src: string;
  flip?: boolean;
  zoom?: boolean;
  photo?: CardPhoto | null;
  shade?: PromoShade;
}) {
  const mirror = photo ? "" : flip ? "ltr:-scale-x-100" : "rtl:-scale-x-100";
  return (
    <>
      {/* The mirror is on a wrapper: on the image itself the hover zoom would
          set the same `scale` and turn it back. */}
      <span aria-hidden className={`absolute inset-0 -z-10 ${mirror}`}>
        <Image
          src={photo?.src ?? src}
          alt=""
          fill
          sizes="(min-width: 1280px) 420px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          // On screen with the hero from the first paint, so not left for the
          // lazy loader; no preload either, which would compete with the
          // hero's own (the page's LCP).
          loading="eager"
          unoptimized={photo ? !canOptimiseImage(photo.src) : false}
          style={photo ? { objectPosition: `${photo.focusX}% 50%` } : undefined}
          className={`object-cover ${photo ? "" : flip ? "object-left" : "object-right"} ${
            zoom ? "transition-transform duration-700 ease-out motion-safe:group-hover:scale-105" : ""
          }`}
        />
      </span>
      {/* Clear at its far end: a veil dark all over (it once ended at 25%) looked the same from every side. */}
      <span aria-hidden className={`pointer-events-none absolute inset-0 -z-10 from-black/85 via-black/40 to-transparent ${VEIL[shade]}`} />
    </>
  );
}

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
      <Backdrop {...BACKDROPS.channels} photo={box?.photos?.top} shade={box?.shades?.top} />
      <div>
        <p className={`${OVERLINE} text-white/70`}>{box?.text || t.followUs}</p>
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
                className={`group/channel flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${tone}`}
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
      className={`group ${CARD} transition-shadow duration-300 hover:shadow-xl hover:shadow-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <Backdrop {...BACKDROPS.advantages} photo={box?.photos?.bottom} shade={box?.shades?.bottom} zoom />
      <div>
        <p className={`${OVERLINE} text-red-400`}>{eyebrow}</p>
        <h2 className={TITLE}>{box?.title || t.aside.advantagesTitle}</h2>
        <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-white/80 lg:text-[13px] lg:leading-snug">
          {box?.bottomText || t.aside.advantagesText}
        </p>
      </div>
      <span className="mt-4 inline-flex w-max items-center text-sm font-semibold text-red-400 transition-colors group-hover:text-red-300">
        {box?.widget?.anchor_label || t.aside.advantagesLink}
        <ArrowUpRight
          className="ms-1 h-4 w-4 transition-transform rtl:-scale-x-100 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5"
          aria-hidden
        />
      </span>
    </SmoothAnchor>
  );
}

/**
 * The two cards beside the hero: the shop's channels above, the advantages
 * below (ChannelsCard, AdvantagesCard — which /admin/promos previews one by
 * one, each under its own fields). Both read the one promo box: its texts,
 * links, photos and shades; without one they keep their own copy and the
 * channels are left out.
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
      className={`mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:invisible lg:mt-0 lg:flex lg:h-0 lg:min-h-full lg:flex-col lg:overflow-hidden lg:opacity-0 lg:transition-[opacity,visibility] lg:duration-300 motion-reduce:transition-none lg:sidebar-closed:visible lg:sidebar-closed:opacity-100 ${className}`}
    >
      <ChannelsCard box={box} t={t} />
      <AdvantagesCard box={box} t={t} />
    </aside>
  );
}
