import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { canOptimiseImage } from "@/lib/home";
import { homeIcon } from "@/lib/homeIcons";
import type { ResolvedTile } from "@/lib/showcase";
import { SITE_NAME } from "@/lib/site";

/**
 * The layout. On a desktop (`lg`) the grid has 60 narrow columns — 60 is
 * what 2/5, 1/5, 1/4, 1/3 and 1/2 all divide — and each tile spans its share.
 * The gutters are the tiles' own padding (the list pulls itself out by half a
 * gutter on each side), since a `gap` would be paid 59 times across 60 tracks.
 *
 * - The first row: one featured tile, 2/5 of the width, and three narrow
 *   ones, 1/5 each. The featured one is the first of the first four that the
 *   editor marked "geniş" (else the first), set at the front of the row.
 * - The rest: rows of at most four, as even as they come (5 → 3 + 2,
 *   7 → 4 + 3, 9 → 3 + 3 + 3), each row's tiles sharing its width equally,
 *   so there is never a hole, however many tiles the editor holds.
 *
 * On a tablet the first four make a 2×2 block and the rest follow in pairs,
 * an odd last one taking the row; on a phone the featured tile has a row of
 * its own and the rest go in pairs, smaller (an odd last one, again, takes
 * the row). Every row is the same compact height.
 */
interface Placed {
  tile: ResolvedTile;
  /** Its place in the editor's list, for the index number and the key. */
  index: number;
  featured: boolean;
  /** Columns of the desktop's 60. */
  span: number;
  /** The whole row on a tablet (an odd tile left at the end). */
  fullOnTablet: boolean;
  /** The whole row on a phone: the featured tile, and an odd one left at the end. */
  fullOnPhone: boolean;
}

/** Rows of at most four, as even as they come: 5 → [3, 2], 7 → [4, 3], 10 → [4, 3, 3]. */
function rowSizes(count: number): number[] {
  if (count === 0) return [];
  const rows = Math.ceil(count / 4);
  const base = Math.floor(count / rows);
  return Array.from({ length: rows }, (_, i) => base + (i < count % rows ? 1 : 0));
}

function layout(tiles: ResolvedTile[]): Placed[] {
  const indexed = tiles.map((tile, index) => ({ tile, index }));
  const top = indexed.slice(0, 4);
  const featuredAt = Math.max(0, top.findIndex((t) => t.tile.wide));
  const row = [top[featuredAt], ...top.filter((_, i) => i !== featuredAt)];
  // Fewer than four in all: the featured tile still leads, the others share what is left.
  const topSpans = [[60], [36, 24], [30, 15, 15], [24, 12, 12, 12]][row.length - 1] ?? [];
  const placed: Placed[] = row.map((t, i) => ({
    ...t,
    featured: i === 0,
    span: topSpans[i],
    fullOnTablet: row.length % 2 === 1 && i === row.length - 1,
    fullOnPhone: i === 0,
  }));

  const rest = indexed.slice(4);
  let at = 0;
  for (const size of rowSizes(rest.length)) {
    for (const t of rest.slice(at, at + size)) {
      placed.push({ ...t, featured: false, span: 60 / size, fullOnTablet: false, fullOnPhone: false });
    }
    at += size;
  }
  if (rest.length % 2 === 1) placed[placed.length - 1].fullOnTablet = true;
  // On a phone the featured tile takes its own row and the rest go in pairs.
  if (placed.length > 1 && (placed.length - 1) % 2 === 1) placed[placed.length - 1].fullOnPhone = true;
  return placed;
}

/**
 * "Premium Ürün Yelpazesi": the catalog as an editorial grid (`layout`): a
 * featured tile and three narrow ones across the top, the rest in even rows.
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
export function CatalogShowcase({ title, subtitle, tiles }: { title: string; subtitle: string; tiles: ResolvedTile[] }) {
  if (tiles.length === 0) return null;

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

        <ul className="grid w-full grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 md:gap-5 lg:-mx-2.5 lg:w-[calc(100%+1.25rem)] lg:grid-cols-[repeat(60,minmax(0,1fr))] lg:gap-x-0">
          {layout(tiles).map(({ tile, index, featured, span, fullOnTablet, fullOnPhone }) => {
            const Icon = homeIcon(tile.icon);
            // A half-width tile on a phone (≈170px): tighter padding, type and arrow.
            const pair = !fullOnPhone;
            return (
              <li
                key={`${tile.label}-${index}`}
                style={{ "--span": span } as CSSProperties}
                className={`min-w-0 ${featured ? "h-[240px]" : pair ? "h-[170px]" : "h-[190px]"} md:h-[220px] lg:px-2.5 lg:[grid-column:span_var(--span)] ${
                  fullOnPhone ? "col-span-2" : ""
                } ${fullOnTablet ? "md:col-span-2" : fullOnPhone ? "md:col-span-1" : ""}`}
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
                      sizes={`(min-width: 1024px) ${Math.round((span / 60) * 100)}vw, (min-width: 768px) ${fullOnTablet ? "100vw" : "50vw"}, ${fullOnPhone ? "100vw" : "50vw"}`}
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
                    className={`absolute left-4 top-4 rounded-full bg-black/30 px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.2em] text-white/80 tabular-nums ring-1 ring-inset ring-white/15 backdrop-blur-md md:left-5 md:top-5 ${
                      pair ? "max-md:left-3 max-md:top-3 max-md:px-2 max-md:text-[10px]" : ""
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
                          featured ? "text-2xl md:text-3xl" : span <= 12 ? "text-lg md:text-xl lg:text-lg" : "text-xl"
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
                      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-[max-width,opacity,margin] duration-500 ease-out group-hover:mr-1.5 group-hover:max-w-[4.5rem] group-hover:opacity-100">
                        Keşfet
                      </span>
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:rotate-45" />
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
