import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import Link from "@/components/i18n/Link";
import { canOptimiseImage } from "@/lib/home";
import { homeIcon } from "@/lib/homeIcons";
import { homeMessages } from "@/lib/i18n/messages/home";
import { getMessages } from "@/lib/i18n/server";
import { placeShowcase, SHOWCASE_ROWS, type ResolvedTile } from "@/lib/showcase";
import { SITE_NAME } from "@/lib/site";

/**
 * The layout. On a desktop (`lg`) four slots to a row, two rows at most
 * (`placeShowcase`): a tile takes one slot, a "geniş" one two — one to a row —
 * exactly as the editor marked it; a tile past the second row is not drawn
 * (the editor refuses one).
 *
 * Below `lg` two to a row, in the same order: a wide tile takes the row, and a
 * square left alone in its row (before a wide one, or the last) takes it too,
 * so there is never a hole. A half-width tile on a phone (≈170px) is drawn
 * tighter. Every row on a tablet and up is the same compact height.
 */
interface Placed {
  tile: ResolvedTile;
  /** Its place in the editor's list, for the index number and the key. */
  index: number;
  /** Desktop slots: 2 for a wide tile. */
  span: 1 | 2;
  /** The whole row below `lg`: a wide tile, or a square with no partner. */
  full: boolean;
}

function layout(tiles: ResolvedTile[]): Placed[] {
  const placed = placeShowcase(tiles)
    .map((slot, index) => ({ tile: tiles[index], index, span: slot.span, row: slot.row }))
    .filter((t) => t.row < SHOWCASE_ROWS)
    .map(({ tile, index, span }) => ({ tile, index, span, full: span === 2 }));
  // Pair the squares in order; one left without a partner takes the row.
  let alone: Placed | null = null;
  for (const t of placed) {
    if (t.full) {
      if (alone) alone.full = true;
      alone = null;
    } else if (alone) alone = null;
    else alone = t;
  }
  if (alone) alone.full = true;
  return placed;
}

/**
 * "Premium Ürün Yelpazesi": the catalog as an editorial grid (`layout`): rows
 * of four, a wide tile taking two of a row's slots.
 *
 * Each tile is one link — a full-bleed photograph (or, with none yet, the
 * category's icon on the dark floor) under a scrim that is dark where the
 * words are and nearly clear towards the top (a touch of dark is kept there:
 * many photos are shot on white). Under the pointer the photograph grows
 * slowly (700ms), a deeper scrim fades in over the first (gradients cannot
 * be animated; their opacity can), the inner hairline warms to the shop's
 * red, the words lift a little and the arrow opens into "Keşfet". On a touch
 * screen, with no hover, the arrow simply stays; with reduced motion nothing
 * moves. The tile's number in the admin's list sits at the top, quietly.
 *
 * On a white band in the light theme, as before.
 */
export async function CatalogShowcase({ title, subtitle, tiles }: { title: string; subtitle: string; tiles: ResolvedTile[] }) {
  if (tiles.length === 0) return null;
  const t = await getMessages(homeMessages);

  return (
    <section aria-labelledby="showcase-heading" className="bg-white py-12 sm:py-16 dark:bg-transparent">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <h2
          id="showcase-heading"
          // The same weight and tracking as "Hacim büyür. Maliyet küçülür."
          // and the hero's own headline: this site's display voice is Geist at
          // 600 with tight tracking, and 900 reads as a different typeface.
          className="text-balance text-center text-3xl font-semibold tracking-tighter text-foreground md:text-5xl"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-balance text-center text-sm text-muted-foreground">{subtitle}</p>
        )}
        <span aria-hidden className="mx-auto mb-10 mt-4 block h-1.5 w-14 rounded-full bg-red-600" />

        <ul className="grid w-full grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {layout(tiles).map(({ tile, index, span, full }) => {
            const Icon = homeIcon(tile.icon);
            const wide = span === 2;
            // A half-width tile on a phone (≈170px): tighter padding, type and arrow.
            const pair = !full;
            return (
              <li
                key={`${tile.label}-${index}`}
                className={`min-w-0 ${wide ? "h-[220px]" : pair ? "h-[170px]" : "h-[190px]"} md:h-[220px] ${
                  full ? "col-span-2" : ""
                } ${wide ? "" : "lg:col-span-1"}`}
              >
                <Link
                  href={tile.href}
                  className="group relative isolate flex h-full w-full flex-col justify-end overflow-hidden rounded-3xl bg-neutral-900 shadow-[0_18px_40px_-24px_rgb(0_0_0/0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  {/* The photograph, filling the tile, named after the category
                      it opens (image search reads the alt, not the title). */}
                  {tile.image ? (
                    <Image
                      src={tile.image}
                      alt={`${tile.label} | ${SITE_NAME}`}
                      fill
                      sizes={`(min-width: 1280px) ${wide ? 640 : 320}px, (min-width: 1024px) ${wide ? 50 : 25}vw, ${full ? "100vw" : "50vw"}`}
                      unoptimized={!canOptimiseImage(tile.image)}
                      className="-z-20 object-cover object-center transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                    />
                  ) : (
                    <Icon
                      className="absolute inset-0 -z-20 m-auto h-20 w-20 text-white/10 transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                      strokeWidth={0.75}
                      aria-hidden
                    />
                  )}

                  {/* The scrim, and a deeper one that fades in over it under the pointer. */}
                  <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 via-45% to-black/15" />
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/55 via-55% to-black/25 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                  />
                  {/* The inner hairline, warming to red. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 transition-[box-shadow] duration-500 group-hover:shadow-[inset_0_0_0_1px_rgb(248_113_113/0.45),inset_0_-60px_80px_-60px_rgb(220_38_38/0.35)]"
                  />

                  {/* On a small glass pill, so it reads on a photo shot on white too. */}
                  <span
                    aria-hidden
                    className={`absolute start-4 top-4 rounded-full bg-black/30 px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.2em] text-white/80 tabular-nums ring-1 ring-inset ring-white/15 backdrop-blur-md md:start-5 md:top-5 ${
                      pair ? "max-md:start-3 max-md:top-3 max-md:px-2 max-md:text-[10px]" : ""
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div
                    className={`flex w-full items-end justify-between gap-4 p-5 transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-1 md:p-6 ${
                      pair ? "max-md:gap-2 max-md:p-3.5" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <span
                        className={`mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300 ${
                          pair ? "max-md:truncate max-md:text-[10px] max-md:tracking-[0.14em]" : ""
                        }`}
                      >
                        {tile.eyebrow}
                      </span>
                      <h3
                        className={`text-balance font-semibold leading-[1.1] tracking-tighter text-white drop-shadow-md ${
                          wide ? "text-2xl md:text-3xl" : "text-xl lg:text-lg"
                        } ${pair ? "max-md:text-base" : ""}`}
                      >
                        {tile.label}
                      </h3>
                    </div>
                    {/* The arrow, opening into "Keşfet" under the pointer. */}
                    <span
                      aria-hidden
                      className={`flex h-10 shrink-0 items-center rounded-full bg-white/10 px-3 text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition-colors duration-300 group-hover:bg-white group-hover:text-neutral-950 ${
                        pair ? "max-md:h-8 max-md:px-2" : ""
                      }`}
                    >
                      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-[max-width,opacity,margin] duration-500 ease-out group-hover:me-1.5 group-hover:max-w-[4.5rem] group-hover:opacity-100">
                        {t.explore}
                      </span>
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 rtl:-scale-x-100 motion-safe:group-hover:rotate-45 rtl:motion-safe:group-hover:-rotate-45" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
