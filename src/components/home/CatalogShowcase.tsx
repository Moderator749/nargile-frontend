import Image from "next/image";
import Link from "next/link";

import { canOptimiseImage } from "@/lib/home";
import type { ResolvedTile } from "@/lib/showcase";

/**
 * The tile: a photograph with the words on it, and nothing else.
 *
 * `bg-neutral-900` is the floor rather than the decoration — a tile whose
 * category has no product to photograph yet shows its icon against that dark
 * instead of a light panel, so the grid keeps one temperature throughout.
 */
const TILE = [
  "group relative flex min-h-[300px] w-full flex-col justify-end overflow-hidden rounded-3xl md:min-h-[340px]",
  "border border-neutral-800/10 bg-neutral-900 shadow-lg",
  // The halo is thrown down and inwards (a large y-offset against a negative
  // spread), so it pools under the card like light off a stage rather than
  // haloing it evenly.
  "transition-all duration-500 ease-out hover:border-red-500/40",
  "hover:shadow-[0_25px_50px_-10px_rgba(220,38,38,0.45)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  "motion-safe:hover:-translate-y-1.5",
].join(" ");

/**
 * "Premium Ürün Yelpazesi": the catalog as a gallery.
 *
 * Twelve tiles in four rows of wide-square-square and square-square-wide, so
 * the eye travels down the grid instead of scanning a uniform table. Each one
 * is a full-bleed photograph under a dark scrim — the scrim is what lets a
 * title sit on any photograph and still be read, whatever the picture happens
 * to be doing behind it.
 *
 * The whole tile is the link; there is no button, which is also what gives the
 * longer names room to be written out in full.
 */
export function CatalogShowcase({ tiles }: { tiles: ResolvedTile[] }) {
  if (tiles.length === 0) return null;

  return (
    <section aria-labelledby="showcase-heading" className="pb-5 pt-5 sm:pb-6 sm:pt-6">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <h2
          id="showcase-heading"
          // The same weight and tracking as "Hacim büyür. Maliyet küçülür."
          // and the hero's own headline: this site's display voice is Geist at
          // 600 with tight tracking, and 900 reads as a different typeface.
          className="text-balance text-center text-3xl font-semibold tracking-tighter text-foreground md:text-5xl"
        >
          Premium Ürün Yelpazesi
        </h2>
        <span aria-hidden className="mx-auto mb-10 mt-4 block h-1.5 w-14 rounded-full bg-red-600" />

        <ul className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile.label} className={`flex min-w-0${tile.wide ? " md:col-span-2" : ""}`}>
              <Link href={tile.href} className={TILE}>
                {/* The photograph, filling the tile. Decorative: the title is
                    what names the tile, so it carries no alt text of its own. */}
                {tile.image ? (
                  <Image
                    src={tile.image}
                    alt=""
                    fill
                    sizes={tile.wide ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                    unoptimized={!canOptimiseImage(tile.image)}
                    className="object-cover object-center transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.08]"
                  />
                ) : (
                  <tile.Icon
                    className="absolute inset-0 m-auto h-28 w-28 text-white/10 transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.08]"
                    strokeWidth={0.75}
                    aria-hidden
                  />
                )}

                {/* The scrim: dark where the words are, clearing towards the top
                    so the picture is still a picture. */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 via-50% to-black/15 transition-all duration-500 group-hover:via-black/50"
                />

                <div className="relative z-10 w-full p-6 md:p-7">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-red-400 drop-shadow">
                    {tile.eyebrow}
                  </span>
                  <h3 className="w-full text-balance text-xl font-semibold leading-snug tracking-tighter text-white drop-shadow-md transition-colors duration-300 group-hover:text-red-300 md:text-2xl">
                    {tile.label}
                  </h3>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
