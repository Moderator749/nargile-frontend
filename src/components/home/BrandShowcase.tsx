"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { PAGE_CONTAINER } from "@/lib/layout";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

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
  /** How wide the logo is shown, at most (it never outgrows its column). */
  logoDisplayWidth?: number;
  /**
   * For a file with wide blank margins above and below the mark (a square
   * export of a wide logo): the width/height ratio of the band the mark sits
   * in. The logo keeps its width and a frame of that ratio shows just the band,
   * centred, so the text below starts where the mark ends. Left out, the
   * whole file is shown.
   */
  logoFrameRatio?: number;
  description: string;
  /** The brand's own page: every product carrying its name. */
  brandLink: string;
  products: CatalogProduct[];
  /** For each card's category (its fallback line under the brand). */
  categories: Category[];
  /** The brand on the right and the products on the left from `xl`, for a zig-zag down the page. */
  reverseLayout?: boolean;
}

/**
 * One brand under "Markalarımız": the brand on one side — its logo, a line on what it stands for
 * and the way into its collection — and its products on the other as a row of
 * boxed cards that scrolls sideways, four in view on a desktop. Stacked below
 * `xl` (the brand column is too narrow beside the cards before it), the brand first either way. The cards are re-priced for a signed-in
 * visitor.
 *
 * Each section keeps its own track and arrows; `reverseLayout` swaps only the
 * columns' visual order, so the scrolling works the same both ways round.
 *
 * On the page's own background, like the rest of the homepage. From `xl` the
 * brand column runs the full height of the cards beside it: the logo level
 * with their tops, the arrows under the button level with their bottoms.
 */
export function BrandShowcase({
  brandName,
  logoSrc,
  logoWidth,
  logoHeight,
  logoDisplayWidth = 280,
  logoFrameRatio,
  description,
  brandLink,
  products,
  categories,
  reverseLayout = false,
}: BrandShowcaseProps) {
  const headingId = useId();
  const mine = useOwnPrices(products);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const loggedIn = hydrated && !!token;
  const categoryById = new Map(categories.map((c) => [c.id, c]));
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
    <section aria-labelledby={headingId} className="w-full py-8">
      <div className={`${PAGE_CONTAINER} grid grid-cols-1 gap-8 xl:grid-cols-12 xl:items-stretch`}>
        {/* The same top and bottom insets as the track beside it (room for the
            cards' shadow), so the logo starts level with the cards' tops and
            the button ends level with their bottoms. */}
        <div
          className={`order-1 flex h-full flex-col items-start xl:col-span-3 xl:pt-2 xl:pb-6 ${reverseLayout ? "xl:order-2" : ""}`}
        >
          {/* The logo is the heading, under the group's "Markalarımız": it
            already says the name, so no text repeats it on screen. */}
          <h3 id={headingId} className="w-full">
            {logoFrameRatio ? (
              <span
                className="relative block max-w-full overflow-hidden"
                style={{ width: logoDisplayWidth, aspectRatio: logoFrameRatio }}
              >
                <Image
                  src={logoSrc}
                  alt={brandName}
                  fill
                  sizes={`${logoDisplayWidth}px`}
                  className={`object-cover object-center ${LOGO_TONE}`}
                />
              </span>
            ) : (
              <Image
                src={logoSrc}
                alt={brandName}
                width={logoDisplayWidth}
                height={Math.round((logoDisplayWidth * logoHeight) / logoWidth)}
                style={{ width: logoDisplayWidth }}
                className={`h-auto max-w-full object-contain ${LOGO_TONE}`}
              />
            )}
          </h3>
          <p className="mt-4 mb-4 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">{description}</p>
          {/* Pushed to the column's foot: the button, and under it the
              arrows, level with the cards' bottoms (the column is too narrow
              for both side by side). The scrollbar is hidden and a mouse
              wheel scrolls the page, not the row, so on a desktop the arrows
              are the way through it; a touch screen swipes the row and sees
              the next card at the edge. Only when there is something past the
              fourth card; without them the button is the bottom. */}
          <div className="mt-auto flex flex-col items-start gap-3">
            <Link
              href={brandLink}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            >
              Koleksiyonu Keşfet
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            {products.length > VISIBLE && (
              <div className="hidden gap-2 lg:flex">
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
        </div>

        <div className={`order-2 w-full overflow-hidden xl:col-span-9 ${reverseLayout ? "xl:order-1" : ""}`}>
          {/* The top padding keeps the cards' shadow from being clipped: a
            sideways scroller clips vertically too. */}
          <ul
            ref={track}
            onScroll={measure}
            className="flex w-full snap-x snap-mandatory flex-row flex-nowrap gap-6 overflow-x-auto scroll-smooth pt-2 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((listed) => {
              const product = mine?.get(listed.id) ?? listed;
              return (
                <li key={listed.id} className={SLIDE}>
                  <div className="flex w-full flex-1 flex-col [&>article]:flex-1">
                    <ProductCard
                      product={product}
                      category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
                      isLoggedIn={loggedIn}
                      publicPrices={!mine}
                      pricesPending={loggedIn && !mine}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
