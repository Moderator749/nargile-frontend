import Image from "next/image";

import { AdvantageCopy } from "@/components/home/AdvantageCopy";
import { canOptimiseImage } from "@/lib/home";
import { homeIcon } from "@/lib/homeIcons";
import type { Homepage } from "@/types";

const CARD = [
  // A hair of padding, so the photograph reads as a canvas set into the card
  // rather than a block severed from it — the card's footprint is unchanged,
  // the picture simply stops short of the edge and rounds its own corners.
  "group relative flex w-full flex-row items-center overflow-hidden rounded-2xl p-2",
  "border border-neutral-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900",
  // The glow is thrown downwards, pooling under the card rather than ringing it.
  "transition-all duration-300 hover:shadow-xl hover:border-red-500/40",
  "hover:shadow-[0_20px_40px_-10px_rgba(220,38,38,0.3)]",
  "motion-safe:hover:-translate-y-1",
].join(" ");

/**
 * "Avantajlar": what buying here is worth, as eight slim cards two to a row.
 *
 * Each one is a portrait photograph and its copy: a slim 4:5 frame on the
 * left, and the figure and the rule behind it on the right, short enough to
 * read at a glance. The frame is a fixed size, which keeps the cards compact.
 * Content and images come from `lib/advantages`.
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
      <div className="text-center">
        {content.eyebrow && (
          <p className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <span aria-hidden>•</span> {content.eyebrow} <span aria-hidden>•</span>
          </p>
        )}
        <h2
          id="advantages-heading"
          className="mt-2 text-balance text-3xl font-semibold tracking-tighter text-foreground md:text-4xl"
        >
          {content.title}
        </h2>
        <p className="mx-auto mb-8 mt-2 max-w-2xl text-sm text-muted-foreground">{content.subtitle}</p>
      </div>

      <ul className="grid auto-rows-fr grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-4">
        {content.cards.map(({ badge, title, description, note, image, icon }, i) => {
          const Icon = homeIcon(icon);
          return (
          <li key={`${title}-${i}`} className="flex min-w-0">
            <div className={CARD}>
              {/* A portrait frame at a fixed size, so every card's picture is
                  the same shape whatever its copy runs to; the scrim on its
                  inner edge stops it ending in a hard line against the text. */}
              <div className="relative aspect-[4/5] w-20 shrink-0 self-center overflow-hidden rounded-xl bg-neutral-100 sm:w-[100px] dark:bg-white/[0.04]">
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 100px, 80px"
                    unoptimized={!canOptimiseImage(image)}
                    className="object-cover object-center transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.08]"
                  />
                ) : (
                  <Icon
                    className="absolute inset-0 m-auto h-10 w-10 text-red-600/70 dark:text-red-400/70"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                )}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/0 via-black/0 to-black/10"
                />
              </div>

              {/* The words, clamped to keep every card the same height; the
                  whole text is a "Devamını oku" away when it does not fit. */}
              <div className="flex min-w-0 flex-1 flex-col justify-center self-stretch bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 dark:bg-zinc-900">
                <AdvantageCopy badge={badge} title={title} description={description} note={note} />
              </div>
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
