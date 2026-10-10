import Image from "next/image";

import { ADVANTAGES } from "@/lib/advantages";
import { canOptimiseImage } from "@/lib/home";

const CARD = [
  // A hair of padding, so the photograph reads as a canvas set into the card
  // rather than a block severed from it — the card's footprint is unchanged,
  // the picture simply stops short of the edge and rounds its own corners.
  "group relative flex w-full min-h-[170px] flex-row items-stretch overflow-hidden rounded-2xl p-2 sm:min-h-[190px]",
  "border border-neutral-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900",
  // The glow is thrown downwards, pooling under the card rather than ringing it.
  "transition-all duration-300 hover:shadow-xl hover:border-red-500/40",
  "hover:shadow-[0_20px_40px_-10px_rgba(220,38,38,0.3)]",
  "motion-safe:hover:-translate-y-1",
].join(" ");

/**
 * "Avantajlar": what buying here is worth, as eight slim cards two to a row.
 *
 * Each one is half photograph, half copy: the picture takes the left of the
 * card edge to edge, which is what gives the row its weight, and the figure and
 * the rule behind it sit on the right, short enough to read at a glance.
 * Content and images come from `lib/advantages`.
 */
export function AdvantagesSection() {
  return (
    <section
      id="avantajlar"
      aria-labelledby="advantages-heading"
      // The bottom space belongs to the section that follows: this one used to
      // be the last before the footer and still carried the padding for it.
      className="mx-auto w-full max-w-7xl scroll-mt-[var(--header-height)] px-4 pb-4 pt-5 sm:px-6 sm:pt-6"
    >
      <div className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <span aria-hidden>•</span> Ayrıcalıklar &amp; Avantajlar <span aria-hidden>•</span>
        </p>
        <h2
          id="advantages-heading"
          className="mt-2 text-balance text-3xl font-semibold tracking-tighter text-foreground md:text-4xl"
        >
          Hacim büyür. Maliyet küçülür.
        </h2>
        <p className="mx-auto mb-8 mt-2 max-w-2xl text-sm text-muted-foreground">
          Sultan Nargile ile alışverişlerinizde toptan ve perakende ayrıcalıklarından yararlanın.
        </p>
      </div>

      <ul className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {ADVANTAGES.map(({ badge, title, description, note, image, Icon }) => (
          <li key={title} className="flex min-w-0">
            <div className={CARD}>
              {/* Half the card, full height: the photograph is the thing the
                  eye lands on, and the scrim on its inner edge stops it ending
                  in a hard line against the copy. */}
              <div className="relative w-[45%] shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:w-1/2 dark:bg-white/[0.04]">
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 25vw, 45vw"
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

              {/* The badge and the title are pinned; everything under them
                  scrolls in place. A long description then costs the card
                  nothing — no stretched tile, no row of mismatched heights, and
                  nothing cut off mid-sentence either. */}
              <div className="flex min-w-0 flex-1 flex-col justify-center bg-white p-3 sm:p-4 dark:bg-zinc-900">
                <p className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  {badge}
                </p>
                <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground transition-colors duration-300 group-hover:text-red-600 sm:text-base dark:group-hover:text-red-400">
                  {title}
                </h3>

                <div className="scroll-slim mt-1 max-h-[120px] overflow-y-auto overscroll-contain pr-1.5 sm:max-h-[140px]">
                  <p className="text-xs font-medium leading-relaxed text-neutral-500 dark:text-zinc-400">
                    {description}
                  </p>
                  {note && (
                    <p className="mt-2 border-t border-neutral-100 pt-2 text-[10px] font-medium leading-4 text-neutral-400 sm:text-[11px] dark:border-white/10 dark:text-zinc-500">
                      {note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
