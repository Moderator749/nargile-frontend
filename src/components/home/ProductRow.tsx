"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { PAGE_CONTAINER } from "@/lib/layout";
import type { CatalogProduct, Category } from "@/types";

/**
 * Five across from `xl`; four from `lg`, three from `md`, two from `sm`, and
 * 70% of a phone's width so the next card peeks in — the SultanPuan row's
 * sizes. Each width is short by its share of the 1rem gaps (four gaps between
 * five). A fixed width, not a minimum, so a long name cannot push a card wider.
 */
const SLIDE =
  "flex shrink-0 snap-start flex-col w-[70vw] sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] xl:w-[calc(20%-0.8rem)]";

/**
 * `elevated`: the cards come alive under the pointer — a red edge, a warm
 * shadow and a small rise — over a soft resting shadow, so they stand off the
 * white rather than sit on it as boxes. Applied over the shared card's own
 * frame (the `> article` selector outranks its classes).
 */
const ELEVATED_CARD = [
  "[&>article]:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_10px_28px_-16px_rgb(15_23_42/0.22)]",
  "[&>article]:transition-[transform,border-color,box-shadow] [&>article]:duration-300 [&>article]:ease-out",
  "hover:[&>article]:border-red-300 hover:[&>article]:shadow-[0_18px_36px_-18px_rgb(220_38_38/0.4)]",
  "motion-safe:hover:[&>article]:-translate-y-1",
  "dark:hover:[&>article]:border-red-400/50",
].join(" ");

const ARROW =
  "flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors duration-200 hover:border-gray-900 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:border-border dark:bg-transparent dark:text-neutral-300 dark:hover:border-white dark:hover:text-white dark:focus-visible:outline-white";

interface ProductRowProps {
  headingId: string;
  title: string;
  subtitle: string;
  /** Beside the heading, at the right from `md` (the picks' tabs). */
  actions?: ReactNode;
  /** As listed; `mine` holds a signed-in visitor's own copies, by id. */
  products: CatalogProduct[];
  mine: Map<string, CatalogProduct> | null;
  loggedIn: boolean;
  categories: Category[];
  /** The section's own band and spacing. */
  className?: string;
  /**
   * Behind everything, inside the section: a band's own background layers
   * (the lüle row's mesh). The section's `className` makes it the frame
   * (`relative isolate overflow-hidden`).
   */
  decoration?: ReactNode;
  /** The livelier card treatment (`ELEVATED_CARD`). */
  elevated?: boolean;
}

/**
 * A homepage product section as one row that slides sideways: the heading
 * over a single line of catalog cards (`ProductCard`), swiped on a phone,
 * scrolled with a trackpad, or moved a card at a time with the arrows under
 * it. The row snaps to a card's edge and hides its scrollbar. "Sizin İçin
 * Seçtiklerimiz" and "Lüle Alırken Kararsız Kalacaksınız" are both this, so they read as a pair.
 *
 * A new list (another tab) starts the row from its first card.
 */
export function ProductRow({
  headingId,
  title,
  subtitle,
  actions,
  products,
  mine,
  loggedIn,
  categories,
  className = "",
  decoration,
  elevated = false,
}: ProductRowProps) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const track = useRef<HTMLUListElement>(null);
  // Which ends the track is at, so the arrow that cannot move it is disabled
  // and, when every card is in view, neither is shown. It starts at the first
  // card with more to come, so the arrows are in the server's HTML and nothing
  // under the row moves when the measurement arrives.
  const [ends, setEnds] = useState({ start: true, end: false });

  function measure() {
    const el = track.current;
    if (!el) return;
    setEnds({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  }

  useEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = 0;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [products]);

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
    <section aria-labelledby={headingId} className={className}>
      {decoration}
      {/* The page's gutters on the wrapper, so the header and the row inside it
          line up with every other row. */}
      <div className={PAGE_CONTAINER}>
        <div className="mb-6 flex w-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id={headingId} className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl dark:text-white">
              {title}
            </h2>
            <p className="mt-2 text-gray-500 dark:text-neutral-400">{subtitle}</p>
          </div>
          {actions}
        </div>

        {/* The padding keeps the cards' shadow from being clipped: a sideways
            scroller clips vertically too. An elevated row's deeper shadows and
            rise need more of it, on every side, given back by negative
            margins so the cards still line up with the heading (the width
            is set, not `w-full`, or the margins would only shift it); its
            snap keeps to that line (scroll-px). */}
        <ul
          ref={track}
          onScroll={measure}
          className={`flex snap-x snap-mandatory flex-row flex-nowrap gap-4 overflow-x-auto overscroll-x-contain scroll-smooth motion-reduce:scroll-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            elevated ? "-mx-4 -mb-8 w-[calc(100%+2rem)] scroll-px-4 px-4 pt-3 pb-10" : "w-full pt-2 pb-2"
          }`}
        >
          {products.map((listed) => {
            // A signed-in visitor's own copy, once it is in; its price is theirs.
            const product = mine?.get(listed.id) ?? listed;
            return (
              <li key={listed.id} className={SLIDE}>
                <div className={`flex w-full flex-1 flex-col [&>article]:flex-1 ${elevated ? ELEVATED_CARD : ""}`}>
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

        {!(ends.start && ends.end) && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" onClick={() => slide(-1)} disabled={ends.start} aria-label="Önceki ürünler" className={ARROW}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => slide(1)} disabled={ends.end} aria-label="Sonraki ürünler" className={ARROW}>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
