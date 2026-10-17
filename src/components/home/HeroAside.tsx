import type { ComponentType } from "react";
import { ArrowUpRight } from "lucide-react";

import { InstagramIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import { SmoothAnchor } from "@/components/home/SmoothAnchor";
import type { PromoBox } from "@/lib/home";

/** The channels, in order, each in its brand's colours; one without a link in /admin/promos is left out. */
const CHANNELS: { key: "instagram" | "youtube"; Icon: ComponentType<{ className?: string }>; tone: string }[] = [
  {
    key: "instagram",
    Icon: InstagramIcon,
    tone: "border-pink-200 text-pink-600 hover:border-transparent hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 hover:text-white focus-visible:outline-pink-600 dark:border-pink-500/40 dark:text-pink-400",
  },
  {
    key: "youtube",
    Icon: YouTubeIcon,
    tone: "border-red-200 text-red-600 hover:border-transparent hover:bg-[#FF0000] hover:text-white focus-visible:outline-red-600 dark:border-red-500/40 dark:text-red-400",
  },
];

/** The advantages card's line under its title; the promo box has no field for it. */
const ADVANTAGES_TEXT = "Sultan Nargile ile alışverişlerinizde toptan ve perakende ayrıcalıklarından yararlanın.";

const CARD =
  "relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm shadow-black/[0.04] ring-1 ring-inset ring-black/[0.04] dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]";
const OVERLINE = "text-xs font-bold uppercase tracking-widest";
const TITLE = "mt-1.5 text-balance text-xl font-extrabold leading-tight text-gray-900 dark:text-white";

/** A faint warmth in the corner, the shop's red at a whisper. */
function Glow() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgb(185_28_28/0.10),transparent_70%)] transition-transform duration-500 motion-safe:group-hover:scale-125"
    />
  );
}

/**
 * The two cards beside the hero, stacked to its height: the shop's channels
 * above, the advantages below. Both read the "social" promo box in
 * /admin/promos (its label and links, its eyebrow, title and anchor); without
 * one they keep their own copy and the channels are left out.
 *
 * They are there only while the category column is closed and only from `lg`:
 * opening the column folds this column away (the row's grid takes its width to
 * 0) and the cards fade out with it, so the slider keeps the rest of the row.
 * Below `lg` the footer's icons are the way to the channels.
 *
 * `h-0 min-h-full`: the column takes the slider's height and gives the row
 * none of its own — folded to no width, its text would otherwise stand a
 * letter wide and stretch the slider down the page.
 */
export function HeroAside({ box }: { box?: PromoBox }) {
  const widget = box?.widget;
  // The admin types the dots into the eyebrow; the overline has none.
  const eyebrow = box?.eyebrow.replace(/^[•·\s]+|[•·\s]+$/g, "") || "Ayrıcalıklar & Avantajlar";
  const channels = CHANNELS.flatMap(({ key, Icon, tone }) => {
    const href = widget?.[`${key}_href`];
    return href ? [{ key, href, label: widget![`${key}_label`] || key, Icon, tone }] : [];
  });

  return (
    <aside
      aria-label="Öne çıkanlar"
      className="invisible hidden min-w-0 flex-col gap-4 overflow-hidden opacity-0 lg:h-0 lg:min-h-full transition-[opacity,visibility] duration-300 motion-reduce:transition-none lg:flex sidebar-closed:visible sidebar-closed:opacity-100"
    >
      <div className={CARD}>
        <Glow />
        <div className="relative">
          <p className={`${OVERLINE} text-gray-500 dark:text-neutral-400`}>{box?.text || "Bizi takip edin"}</p>
          <h2 className={TITLE}>Topluluğa Katılın</h2>
        </div>
        {channels.length > 0 && (
          <ul className="relative mt-4 flex gap-2">
            {channels.map(({ key, href, label, Icon, tone }) => (
              <li key={key} className="min-w-0 flex-1">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:text-white ${tone}`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
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
        className={`group ${CARD} transition-shadow duration-300 hover:shadow-xl hover:shadow-black/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      >
        <Glow />
        <div className="relative">
          <p className={`${OVERLINE} text-red-600 dark:text-red-400`}>{eyebrow}</p>
          <h2 className={TITLE}>{box?.title || "Hacim büyür. Maliyet küçülür."}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">{ADVANTAGES_TEXT}</p>
        </div>
        <span className="relative mt-3 inline-flex w-max items-center text-sm font-semibold text-red-700 transition-colors group-hover:text-red-900 dark:text-red-400 dark:group-hover:text-red-300">
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
