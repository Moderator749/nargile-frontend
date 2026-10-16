"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import { ShowcaseProductCard, useOwnPrices } from "@/components/home/ShowcaseProductCard";
import { PAGE_CONTAINER } from "@/lib/layout";
import { brandHref } from "@/lib/seo";
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

/** The house brand's own page: every product carrying its name. */
const COLLECTION_HREF = brandHref("sultan");

/**
 * "Markalarımız": the house brand on the left — its logo, a line on what it
 * stands for and the way into its collection — and its products on the right
 * as a row of boxed cards that scrolls sideways, four in view on a desktop.
 * Stacked below `lg`. The cards are re-priced for a signed-in visitor.
 */
export function BrandShowcase({ products }: { products: CatalogProduct[] }) {
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
      aria-labelledby="markalarimiz-baslik"
      className={`${PAGE_CONTAINER} my-16 grid grid-cols-1 items-center gap-8 lg:grid-cols-12`}
    >
      <div className="flex flex-col items-start lg:col-span-3">
        <p className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">Markalarımız</p>
        {/* The logo is the heading: it already says the name, so no text
            repeats it on screen. Dark ink on transparency; on the dark theme
            it is inverted with its red turned back to red, as the header's
            wordmark is. */}
        <h2 id="markalarimiz-baslik" className="mt-4 w-full">
          <Image
            src="/images/logo.png"
            alt="Sultan Nargile"
            width={280}
            height={37}
            className="h-auto w-[280px] max-w-full object-contain dark:hue-rotate-180 dark:invert dark:saturate-[2.5]"
          />
        </h2>
        <p className="mt-4 mb-6 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
          Geleneksel nargile zanaatını modern mühendislikle buluşturan Sultan Nargile; dayanıklı çelik takımları,
          tescilli aksesuarları ve benzersiz içim kalitesiyle sektör standartlarını belirliyor.
        </p>
        <Link
          href={COLLECTION_HREF}
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

      <div className="w-full overflow-hidden lg:col-span-9">
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
