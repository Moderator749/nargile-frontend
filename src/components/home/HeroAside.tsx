import type { ComponentType } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { InstagramIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import { SmoothAnchor } from "@/components/home/SmoothAnchor";
import type { PromoBox } from "@/lib/home";

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

/** The advantages card's line under its title; the promo box has no field for it. */
const ADVANTAGES_TEXT = "Sultan Nargile ile alışverişlerinizde toptan ve perakende ayrıcalıklarından yararlanın.";

/**
 * The shop's own photographs (also on the advantage tiles), dark and red:
 * accessories, and an ornate set. Neither carries another brand's name, as the
 * Legend and Oduman shots do — the advantages card speaks for Sultan Nargile.
 * The set stands on the left of its frame, so it is mirrored to clear the words.
 */
const BACKDROPS = {
  channels: { src: "/images/avantaj-hero-3.jpg" },
  advantages: { src: "/images/avantaj-hero-1.jpg", flip: true },
};

/**
 * A card on a photograph: dark in either theme, as the slider beside it is.
 * Its own height below `lg` (where it stands under the slider), half the
 * slider's from `lg`. The hairline is drawn over the photograph, which would
 * otherwise cover a ring on the card itself.
 */
const CARD = [
  "relative isolate flex min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl bg-neutral-950 p-6 shadow-sm lg:min-h-0 lg:flex-1",
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-inset after:ring-white/10",
].join(" ");
const OVERLINE = "text-xs font-bold uppercase tracking-widest";
const TITLE = "mt-1.5 text-balance text-xl font-extrabold leading-tight text-white";

/**
 * The photograph behind a card, under a veil that is darkest on the left,
 * where the words are, and clears towards the subject on the right.
 */
function Backdrop({ src, flip, zoom }: { src: string; flip?: boolean; zoom?: boolean }) {
  return (
    <>
      {/* The mirror is on a wrapper: on the image itself the hover zoom would
          set the same `scale` and turn it back. */}
      <span aria-hidden className={`absolute inset-0 -z-10 ${flip ? "-scale-x-100" : ""}`}>
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1280px) 420px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={`object-cover ${flip ? "object-left" : "object-right"} ${
            zoom ? "transition-transform duration-700 ease-out motion-safe:group-hover:scale-105" : ""
          }`}
        />
      </span>
      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
    </>
  );
}

/**
 * The two cards beside the hero: the shop's channels above, the advantages
 * below. Both read the "social" promo box in /admin/promos (its label and
 * links, its eyebrow, title and anchor); without one they keep their own copy
 * and the channels are left out.
 *
 * Below `lg` they stand under the slider, side by side from `sm` and stacked on
 * a phone, so a small screen keeps the channels and the way to the advantages.
 * From `lg` they are stacked beside it to its height, and only while the
 * category column is closed: opening the column folds this column away (the
 * row's grid takes its width to 0) and the cards fade out with it, so the
 * slider keeps the rest of the row.
 *
 * `h-0 min-h-full`: from `lg` the column takes the slider's height and gives
 * the row none of its own — folded to no width, its text would otherwise stand
 * a letter wide and stretch the slider down the page.
 */
export function HeroAside({ box }: { box?: PromoBox }) {
  const widget = box?.widget;
  // The admin types the dots into the eyebrow; the overline has none.
  const eyebrow = box?.eyebrow.replace(/^[•·\s]+|[•·\s]+$/g, "") || "Ayrıcalıklar & Avantajlar";
  const channels = CHANNELS.flatMap(({ key, ...channel }) => {
    const href = widget?.[`${key}_href`];
    return href ? [{ key, href, label: widget![`${key}_label`] || key, ...channel }] : [];
  });

  return (
    <aside
      aria-label="Öne çıkanlar"
      className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:invisible lg:mt-0 lg:flex lg:h-0 lg:min-h-full lg:flex-col lg:overflow-hidden lg:opacity-0 lg:transition-[opacity,visibility] lg:duration-300 motion-reduce:transition-none lg:sidebar-closed:visible lg:sidebar-closed:opacity-100"
    >
      <div className={CARD}>
        <Backdrop {...BACKDROPS.channels} />
        <div>
          <p className={`${OVERLINE} text-white/70`}>{box?.text || "Bizi takip edin"}</p>
          <h2 className={TITLE}>Topluluğa Katılın</h2>
        </div>
        {channels.length > 0 && (
          <ul className="mt-4 flex gap-2">
            {channels.map(({ key, href, label, Icon, tone, glyph }) => (
              <li key={key} className="min-w-0 flex-1">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group/channel flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${tone}`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors group-hover/channel:text-white ${glyph}`} />
                  <span className="truncate">{label}</span>
                  <span className="sr-only">(yeni sekmede açılır)</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SmoothAnchor
        href={box?.href || "/#avantajlar"}
        className={`group ${CARD} transition-shadow duration-300 hover:shadow-xl hover:shadow-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      >
        <Backdrop {...BACKDROPS.advantages} zoom />
        <div>
          <p className={`${OVERLINE} text-red-400`}>{eyebrow}</p>
          <h2 className={TITLE}>{box?.title || "Hacim büyür. Maliyet küçülür."}</h2>
          <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-white/80">{ADVANTAGES_TEXT}</p>
        </div>
        <span className="mt-4 inline-flex w-max items-center text-sm font-semibold text-red-400 transition-colors group-hover:text-red-300">
          {widget?.anchor_label || "Avantajları keşfet"}
          <ArrowUpRight
            className="ml-1 h-4 w-4 transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </SmoothAnchor>
    </aside>
  );
}
