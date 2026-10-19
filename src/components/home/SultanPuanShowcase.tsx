"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { Coin, FIGURE, GOLD } from "@/components/home/AdvantagesSection";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { PAGE_CONTAINER } from "@/lib/layout";
import { retailPerks } from "@/lib/perks";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { Category, SultanPuanShowcase as Showcase } from "@/types";

/**
 * Five across from `xl`; four from `lg`, three from
 * `md`, two from `sm`, and 70% of a phone's width so the next card peeks in.
 * Each width is short by its share of the 1rem gaps (four gaps between five).
 * A fixed width, not a minimum, so a long name cannot push a card wider.
 */
const SLIDE =
  "flex shrink-0 snap-start flex-col w-[70vw] sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] xl:w-[calc(20%-0.8rem)]";

const ARROW =
  "flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-900 transition-colors duration-200 hover:border-amber-500 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-amber-400/20 dark:bg-transparent dark:text-amber-200 dark:hover:border-amber-300";

/** The small minted coin on each card: the advantages section's, card-sized. */
const CARD_COIN =
  "pointer-events-none absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-[9px] font-bold tracking-tight text-amber-950/80 shadow-[0_6px_14px_-6px_rgba(217,119,6,0.6)] ring-1 ring-inset ring-white/50";

const whole = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

/** "20000.00"–"29999.99" → "20.000–29.999 TL": whole liras, the band's inside. */
export function bandText(min: string, max: string): string {
  return `${whole.format(Math.ceil(Number(min)))}–${whole.format(Math.floor(Number(max)))} TL`;
}

/** "10.00" → "%10", "2.50" → "%2,5". */
export function rateText(percent: string): string {
  return `%${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(Number(percent))}`;
}

/**
 * "%10 SultanPuan": the loyalty programme's own row on the homepage — a gold
 * band, edge to edge, the offer across its top (the rate and the band it is earned in, both
 * live from "Parametreler", and "Kazanan Siz Olun!" by the coin), and under it, sliding sideways, every product
 * whose price alone lands an order in that band, each marked with the coin.
 *
 * Sultan Puan is a retail perk: a signed-in B2B account (which cannot earn it)
 * does not see the row; a visitor, a retail customer and the panel's staff do.
 * The cards are re-priced for a signed-in visitor, as everywhere on the page.
 */
export function SultanPuanShowcase({ showcase, categories }: { showcase: Showcase; categories: Category[] }) {
  const headingId = useId();
  const { products } = showcase;
  const mine = useOwnPrices(products);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
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

  if (!showcase.enabled || products.length === 0) return null;
  if (loggedIn && user && !retailPerks(user) && !isAdminRole(user.role)) return null;

  const rate = rateText(showcase.rate_percent);
  const band = bandText(showcase.band_min, showcase.band_max);

  return (
    // The whole band is gold, edge to edge, from the picks above to the dark
    // deals band below: amber through cream, so it reads as gold and not as grey.
    <section
      aria-labelledby={headingId}
      className="w-full bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-50 py-10 md:py-12 dark:from-amber-400/[0.12] dark:via-amber-400/[0.05] dark:to-zinc-950"
    >
      <div className={PAGE_CONTAINER}>
        {/* The offer in three parts: the rate over its band, what the
            points do, the call and the coin. From `lg` one row, the note
            truly centred between the two ends; from `sm` the two ends share
            a row with the note under them; on a phone all three stack. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="min-w-0">
            <h2 id={headingId} className="flex items-baseline gap-2">
              <span className={`${FIGURE} ${GOLD} text-3xl md:text-4xl`}>{rate}</span>
              <span className="text-2xl font-extrabold tracking-tight text-amber-950 md:text-3xl dark:text-amber-100">
                SultanPuan
              </span>
            </h2>
            <p className="mt-1 text-sm font-semibold text-amber-800 tabular-nums dark:text-amber-200/80">
              {band} alışverişlerde
            </p>
          </div>
          <p className="text-sm font-medium text-amber-900/80 sm:col-span-2 sm:row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:text-center md:text-base dark:text-amber-100/70">
            Puanınız sonraki alışverişinizde indirim olur.
          </p>
          <div className="flex shrink-0 items-center gap-3 sm:col-start-2 sm:row-start-1 sm:justify-self-end lg:col-start-3">
            <p className="text-base font-extrabold tracking-tight text-black md:text-lg dark:text-white">
              Kazanan Siz Olun!
            </p>
            <Coin />
          </div>
        </div>

        {/* The top padding keeps the cards' shadow from being clipped: a
            sideways scroller clips vertically too. */}
        <ul
          ref={track}
          onScroll={measure}
          className="mt-4 flex w-full snap-x snap-mandatory flex-row flex-nowrap gap-4 overflow-x-auto scroll-smooth pt-2 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((listed) => {
            const product = mine?.get(listed.id) ?? listed;
            return (
              <li key={listed.id} className={SLIDE}>
                {/* The coin on the card's top-left: this row's mark, laid
                    over the shared card rather than built into it. */}
                <div className="relative flex w-full flex-1 flex-col [&>article]:flex-1">
                  <ProductCard
                    product={product}
                    category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
                    isLoggedIn={loggedIn}
                    publicPrices={!mine}
                    pricesPending={loggedIn && !mine}
                  />
                  <span aria-hidden className={CARD_COIN}>
                    SP
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Under the cards, centred: how many, and the arrows. */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="text-xs font-semibold text-amber-800/70 tabular-nums dark:text-amber-200/60">
            {products.length} ürün
          </span>
          <button type="button" onClick={() => slide(-1)} disabled={ends.start} aria-label="Önceki ürünler" className={ARROW}>
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" onClick={() => slide(1)} disabled={ends.end} aria-label="Sonraki ürünler" className={ARROW}>
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
