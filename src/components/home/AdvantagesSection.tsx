import { createElement } from "react";
import type { LucideProps } from "lucide-react";

import { homeIcon } from "@/lib/homeIcons";
import type { HomeAdvantageCard, HomeIconKey, Homepage } from "@/types";

/**
 * Where each card sits in the bento, by its place in the list (the order set
 * in "Ana Sayfa Düzenleme"). Eight cards fill four columns three rows deep on
 * a desktop and three columns four deep on a tablet:
 *
 *   lg  [0 0][1 1]      md  [0 0][1]
 *       [0 0][2][3]         [0 0][2]
 *       [4][5][6][7]        [3][4][5]
 *                           [6][7 7]
 *
 * The first is the feature (dark), the second runs wide, the last carries the
 * brand's red. A list of another length still packs: `grid-flow-dense` fills
 * whatever the pattern leaves open.
 */
type Tone = "feature" | "accent" | "plain";
const LAYOUT: { span: string; tone: Tone; wide?: boolean }[] = [
  { span: "md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2", tone: "feature" },
  { span: "lg:col-span-2", tone: "plain", wide: true },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "md:col-span-2 lg:col-span-1", tone: "accent" },
];

const BASE = [
  "group relative isolate flex min-w-0 flex-col overflow-hidden rounded-3xl p-6 lg:p-7",
  // A lift and a soft shadow pooling under the card, nothing louder.
  "transition-[transform,box-shadow] duration-300 ease-out motion-safe:hover:-translate-y-1",
].join(" ");

const TONE: Record<Tone, string> = {
  plain: [
    "border border-black/[0.04] bg-white text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
    "hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.18)]",
    "dark:border-white/[0.06] dark:bg-zinc-900 dark:text-white dark:hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]",
  ].join(" "),
  feature: [
    "bg-gray-900 text-white shadow-[0_24px_48px_-28px_rgba(0,0,0,0.5)]",
    "hover:shadow-[0_32px_64px_-28px_rgba(0,0,0,0.6)]",
    "dark:bg-zinc-900 dark:ring-1 dark:ring-inset dark:ring-white/10",
  ].join(" "),
  accent: [
    "bg-gradient-to-br from-red-600 to-red-800 text-white shadow-[0_24px_48px_-28px_rgba(185,28,28,0.6)]",
    "hover:shadow-[0_32px_64px_-28px_rgba(185,28,28,0.7)]",
  ].join(" "),
};

/** The icon's chip: quiet on white, frosted on the dark and red cards. */
const CHIP: Record<Tone, string> = {
  plain:
    "bg-red-50 text-red-600 ring-1 ring-inset ring-red-100 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
  feature: "bg-white/10 text-white ring-1 ring-inset ring-white/15",
  accent: "bg-white/15 text-white ring-1 ring-inset ring-white/20",
};

/** A card's icon (chosen in "Ana Sayfa Düzenleme"), looked up by its key. */
function AdvantageIcon({ icon, ...props }: { icon: HomeIconKey } & LucideProps) {
  return createElement(homeIcon(icon), props);
}

/**
 * "Avantajlar": what buying here is worth, as a bento of type-led cards — no
 * photographs, each card its icon, its figure or label, its title, the rule
 * behind it and the small print, all of it in full. Content from "Ana Sayfa
 * Düzenleme"; a card's picture, if one was uploaded, is not used here.
 */
export function AdvantagesSection({ content }: { content: Homepage["advantages"] }) {
  if (content.cards.length === 0 && !content.title) return null;
  return (
    <section
      id="avantajlar"
      aria-labelledby="advantages-heading"
      // The bottom space belongs to the section that follows: this one used to
      // be the last before the footer and still carried the padding for it.
      className="mx-auto w-full max-w-7xl scroll-mt-[var(--header-height)] px-4 pb-4 pt-5 sm:px-6 sm:pt-6"
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        {content.eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">
            {content.eyebrow}
          </p>
        )}
        <h2
          id="advantages-heading"
          className="mt-3 text-balance text-3xl font-semibold tracking-tighter text-foreground md:text-5xl"
        >
          {content.title}
        </h2>
        {content.subtitle && (
          <p className="mt-4 text-balance text-base leading-relaxed text-gray-500 dark:text-zinc-400">
            {content.subtitle}
          </p>
        )}
      </div>

      <ul className="grid grid-flow-dense grid-cols-1 gap-4 md:auto-rows-[minmax(12.5rem,auto)] md:grid-cols-3 lg:grid-cols-4">
        {content.cards.map((card, i) => {
          const place = LAYOUT[i] ?? { span: "", tone: "plain" as const };
          return (
            <li key={`${card.title}-${i}`} className={`${BASE} ${TONE[place.tone]} ${place.span}`}>
              {place.tone === "feature" ? (
                <FeatureCard card={card} />
              ) : (
                <TileCard card={card} tone={place.tone} wide={place.wide} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The bento's centrepiece: the figure set large, the rule and the small print under it. */
function FeatureCard({ card }: { card: HomeAdvantageCard }) {
  return (
    <>
      {/* The card's icon again, vast and all but invisible: texture, not content. */}
      <AdvantageIcon
        icon={card.icon}
        aria-hidden
        strokeWidth={0.75}
        className="pointer-events-none absolute -bottom-10 -right-10 -z-10 h-64 w-64 text-white/[0.04] transition-transform duration-700 ease-out motion-safe:group-hover:-rotate-6 motion-safe:group-hover:scale-105"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 -z-10 h-64 w-64 rounded-full bg-red-600/25 blur-3xl"
      />
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${CHIP.feature}`}>
        <AdvantageIcon icon={card.icon} className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="mt-auto pt-10">
        {card.badge && <p className="text-5xl font-semibold tracking-tighter text-white lg:text-6xl">{card.badge}</p>}
        <h3 className="mt-3 text-xl font-semibold tracking-tight lg:text-2xl">{card.title}</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">{card.description}</p>
        {card.note && (
          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/45">{card.note}</p>
        )}
      </div>
    </>
  );
}

/** Every other card: the icon and the label on top, the words beneath, the small print at the foot. */
function TileCard({ card, tone, wide }: { card: HomeAdvantageCard; tone: Tone; wide?: boolean }) {
  const onColour = tone !== "plain";
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CHIP[tone]}`}>
          <AdvantageIcon icon={card.icon} className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        {card.badge && (
          <span
            className={`truncate text-[11px] font-bold uppercase tracking-wider ${
              onColour ? "text-white/80" : "text-red-600 dark:text-red-400"
            }`}
          >
            {card.badge}
          </span>
        )}
      </div>
      <div className={`mt-6 ${wide ? "lg:max-w-md" : ""}`}>
        <h3 className={`font-semibold tracking-tight ${wide ? "text-lg lg:text-xl" : "text-base"}`}>{card.title}</h3>
        <p
          className={`mt-1.5 text-sm leading-relaxed ${onColour ? "text-white/75" : "text-gray-500 dark:text-zinc-400"}`}
        >
          {card.description}
        </p>
      </div>
      {card.note && (
        <p
          className={`mt-auto pt-5 text-xs leading-relaxed ${onColour ? "text-white/60" : "text-gray-400 dark:text-zinc-500"}`}
        >
          {card.note}
        </p>
      )}
    </>
  );
}
