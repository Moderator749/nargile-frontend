"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import { ShowcaseProductCard, useOwnPrices } from "@/components/home/ShowcaseProductCard";
import { PAGE_CONTAINER } from "@/lib/layout";
import type { CatalogProduct } from "@/types";

/**
 * Four across from `lg` and three from `md`, each width short by its share of
 * the 1.5rem gaps (three gaps between four, two between three); 85% of the
 * viewport on a phone, so the next card shows at the edge. A fixed width, not
 * a minimum: a flex item otherwise grows to its longest product name on one
 * line, and four no longer fit.
 */
const SLIDE = "flex shrink-0 snap-start flex-col w-[85vw] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)]";

/** How many cards a desktop shows at once; the arrows appear only past it. */
const VISIBLE = 4;

const ARROW =
  "flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 transition-colors duration-200 hover:border-gray-900 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:border-border dark:bg-transparent dark:text-white dark:hover:border-white dark:focus-visible:outline-white";

/**
 * The logos are dark ink on light, so on the dark theme each is inverted with
 * its hues turned back (red stays red), as the header's wordmark is. Multiplied
 * into the page in the light theme, so a logo saved on white sits on the
 * page's grey with no white box; not in the dark one, where multiplying the
 * inverted logo into black would leave only black.
 */
const LOGO_TONE = "mix-blend-multiply dark:mix-blend-normal dark:hue-rotate-180 dark:invert dark:saturate-[2.5]";

interface BrandShowcaseProps {
  /** Said by the logo: its alt text, and the section's name. */
  brandName: string;
  logoSrc: string;
  /** The logo file's own size, for its proportions. */
  logoWidth: number;
  logoHeight: number;
  /**
   * Shows the logo cropped to this width/height ratio, centred, for a file with
   * a wide margin of blank canvas around the mark (a square export of a wide
   * logo). Left out, the whole file is shown.
   */
  logoCrop?: number;
  description: string;
  /** The brand's own page: every product carrying its name. */
  brandLink: string;
  products: CatalogProduct[];
  /** The brand on the right and the products on the left from `lg`, for a zig-zag down the page. */
  reverseLayout?: boolean;
}

/**
 * "Markalarımız": a brand on one side — its logo, a line on what it stands for
 * and the way into its collection — and its products on the other as a row of
 * boxed cards that scrolls sideways, four in view on a desktop. Stacked below
 * `lg`, the brand first either way. The cards are re-priced for a signed-in
 * visitor.
 *
 * Each section keeps its own track and arrows; `reverseLayout` swaps only the
 * columns' visual order, so the scrolling works the same both ways round.
 */
export function BrandShowcase({
  brandName,
  logoSrc,
  logoWidth,
  logoHeight,
  logoCrop,
  description,
  brandLink,
  products,
  reverseLayout = false,
}: BrandShowcaseProps) {
  const headingId = useId();
  const mine = useOwnPrices(products);
  const track = useRef<HTMLUListElement>(null);
  // Which ends the track is at, so the arrow that cannot move it is disabled.
  const [ends, setEnds] = useState({ start: true, end: false });

  function measure() {
    const el = track.current;
    if (!el) return;
    setEnds({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  }

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [products.length]);

  /** One card and one gap, measured off the track rather than assumed. */
  function slide(direction: 1 | -1) {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !card) return;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      className={`${PAGE_CONTAINER} my-16 grid grid-cols-1 items-center gap-8 lg:grid-cols-12`}
    >
      <div className={`order-1 flex flex-col items-start lg:col-span-3 ${reverseLayout ? "lg:order-2" : ""}`}>
        <p className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">Markalarımız</p>
        {/* The logo is the heading: it already says the name, so no text
            repeats it on screen. */}
        <h2 id={headingId} className="mt-4 w-full">
          {logoCrop ? (
            <span className="relative block w-[280px] max-w-full overflow-hidden" style={{ aspectRatio: logoCrop }}>
              <Image src={logoSrc} alt={brandName} fill sizes="280px" className={`object-cover ${LOGO_TONE}`} />
            </span>
          ) : (
            <Image
              src={logoSrc}
              alt={brandName}
              width={280}
              height={Math.round((280 * logoHeight) / logoWidth)}
              className={`h-auto w-[280px] max-w-full object-contain ${LOGO_TONE}`}
            />
          )}
        </h2>
        <p className="mt-4 mb-6 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">{description}</p>
        <Link
          href={brandLink}
          className="inline-flex items-center gap-2 rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Koleksiyonu Keşfet
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
        {/* The scrollbar is hidden and a mouse wheel scrolls the page, not the
            row, so on a desktop these are the way through it. A touch screen
            swipes the row itself and sees the next card at the edge. Only
            when there is something past the fourth card. */}
        {products.length > VISIBLE && (
          <div className="mt-6 hidden gap-2 lg:flex">
            {([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                onClick={() => slide(direction)}
                disabled={direction === -1 ? ends.start : ends.end}
                aria-label={direction === -1 ? "Önceki ürünler" : "Sonraki ürünler"}
                className={ARROW}
              >
                {direction === -1 ? (
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronRight className="h-4 w-4" aria-hidden />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`order-2 w-full overflow-hidden lg:col-span-9 ${reverseLayout ? "lg:order-1" : ""}`}>
        {/* The top padding keeps the cards' shadow from being clipped: a
            sideways scroller clips vertically too. */}
        <ul
          ref={track}
          onScroll={measure}
          className="flex w-full snap-x snap-mandatory flex-row flex-nowrap gap-6 overflow-x-auto scroll-smooth pt-2 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((listed) => (
            <li key={listed.id} className={SLIDE}>
              <ShowcaseProductCard
                product={mine?.get(listed.id) ?? listed}
                publicPrices={!mine}
                sizes="(min-width: 1024px) 18vw, (min-width: 768px) 30vw, 70vw"
                boxed
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
