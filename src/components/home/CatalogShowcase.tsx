import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { canOptimiseImage } from "@/lib/home";
import { homeIcon } from "@/lib/homeIcons";
import type { ResolvedTile } from "@/lib/showcase";
import { SITE_NAME } from "@/lib/site";

/**
 * A tile's place in the bento. On a desktop (`lg`, four columns, 240px rows)
 * every tile has an explicit area, so the composition holds whatever order
 * the list arrives in; on a tablet (two columns) and a phone (one) the tiles
 * flow in list order and only their width and height change.
 *
 * - `feature`: 2×2 on a desktop, the full row on a tablet, tall on a phone.
 * - `wide`: 2×1 on a desktop, the full row on a tablet.
 * - `square`: 1×1 on a desktop, half a row on a tablet.
 */
type Slot = "feature" | "wide" | "square";

interface Placed {
  tile: ResolvedTile;
  /** Its place in the admin's list, for the index number and the key. */
  index: number;
  slot: Slot;
  /** grid-column / grid-row on a desktop. */
  col: string;
  row: string;
}

/**
 * The tiles as bento blocks of four: each block fills a 4×2 area exactly — a
 * feature (2×2), two squares and a wide tile (2×1) — and every other block is
 * mirrored, so the features zig-zag down the page. A tile the admin marked
 * "geniş" takes the block's feature, then its wide slot; otherwise the order
 * is the admin's. One to three tiles left over close the grid as one full
 * row (a single tile across it, two halves, or a wide and two squares). So
 * there is never a hole, however many tiles the editor holds.
 */
function bento(tiles: ResolvedTile[]): Placed[] {
  const placed: Placed[] = [];
  const indexed = tiles.map((tile, index) => ({ tile, index }));
  const full = Math.floor(indexed.length / 4);

  for (let g = 0; g < full; g++) {
    const group = indexed.slice(g * 4, g * 4 + 4);
    const featureAt = Math.max(0, group.findIndex((t) => t.tile.wide));
    const feature = group[featureAt];
    const rest = group.filter((_, i) => i !== featureAt);
    const wideAt = rest.findIndex((t) => t.tile.wide);
    const wide = rest[wideAt >= 0 ? wideAt : rest.length - 1];
    const [a, b] = rest.filter((t) => t !== wide);
    const row = g * 2 + 1;
    const mirrored = g % 2 === 1;
    placed.push(
      { ...feature, slot: "feature", col: mirrored ? "3 / span 2" : "1 / span 2", row: `${row} / span 2` },
      { ...a, slot: "square", col: mirrored ? "1" : "3", row: `${row}` },
      { ...b, slot: "square", col: mirrored ? "2" : "4", row: `${row}` },
      { ...wide, slot: "wide", col: mirrored ? "1 / span 2" : "3 / span 2", row: `${row + 1}` },
    );
  }

  const left = indexed.slice(full * 4);
  const row = `${full * 2 + 1}`;
  if (left.length === 1) {
    placed.push({ ...left[0], slot: "wide", col: "1 / span 4", row });
  } else if (left.length === 2) {
    placed.push(
      { ...left[0], slot: "wide", col: "1 / span 2", row },
      { ...left[1], slot: "wide", col: "3 / span 2", row },
    );
  } else if (left.length === 3) {
    const wideAt = Math.max(0, left.findIndex((t) => t.tile.wide));
    const [a, b] = left.filter((_, i) => i !== wideAt);
    placed.push(
      { ...left[wideAt], slot: "wide", col: "1 / span 2", row },
      { ...a, slot: "square", col: "3", row },
      { ...b, slot: "square", col: "4", row },
    );
  }
  return placed;
}

/** Each slot's span on a tablet and height below a desktop (where the grid's rows set it). */
const SLOT_CLASS: Record<Slot, string> = {
  feature: "h-[340px] md:col-span-2 md:h-[400px]",
  wide: "h-[240px] md:col-span-2 md:h-[280px]",
  square: "h-[240px] md:h-[280px]",
};

const TITLE_CLASS: Record<Slot, string> = {
  feature: "text-3xl md:text-4xl",
  wide: "text-2xl md:text-[1.75rem]",
  square: "text-xl md:text-2xl",
};

/** The image's share of the viewport at each size, for the browser's choice of file. */
const SIZES: Record<Slot, string> = {
  feature: "(min-width: 1024px) 50vw, 100vw",
  wide: "(min-width: 1024px) 50vw, 100vw",
  square: "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw",
};

/**
 * "Premium Ürün Yelpazesi": the catalog as an editorial bento (`bento`).
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

        <ul className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:auto-rows-[240px] lg:grid-cols-4">
          {bento(tiles).map(({ tile, index, slot, col, row }) => {
            const Icon = homeIcon(tile.icon);
            return (
              <li
                key={`${tile.label}-${index}`}
                style={{ "--bento-col": col, "--bento-row": row } as CSSProperties}
                className={`min-w-0 ${SLOT_CLASS[slot]} lg:h-auto lg:[grid-column:var(--bento-col)] lg:[grid-row:var(--bento-row)]`}
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
                      sizes={SIZES[slot]}
                      unoptimized={!canOptimiseImage(tile.image)}
                      className="-z-20 object-cover object-center transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                    />
                  ) : (
                    <Icon
                      className="absolute inset-0 -z-20 m-auto h-28 w-28 text-white/10 transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
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
                    className="absolute left-5 top-5 rounded-full bg-black/30 px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.2em] text-white/80 tabular-nums ring-1 ring-inset ring-white/15 backdrop-blur-md md:left-6 md:top-6"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="flex w-full items-end justify-between gap-4 p-6 transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-1 md:p-7">
                    <div className="min-w-0">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300">
                        {tile.eyebrow}
                      </span>
                      <h3
                        className={`text-balance font-semibold leading-[1.1] tracking-tighter text-white drop-shadow-md ${TITLE_CLASS[slot]}`}
                      >
                        {tile.label}
                      </h3>
                    </div>
                    {/* The arrow, opening into "Keşfet" under the pointer. */}
                    <span
                      aria-hidden
                      className="flex h-10 shrink-0 items-center rounded-full bg-white/10 px-3 text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition-colors duration-300 group-hover:bg-white group-hover:text-neutral-950"
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
