"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { Coin, FIGURE, GOLD, LABEL, SURFACE } from "@/components/home/AdvantagesSection";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { PAGE_CONTAINER } from "@/lib/layout";
import { retailPerks } from "@/lib/perks";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { Category, SultanPuanShowcase as Showcase } from "@/types";

/**
 * Five across from `xl`, beside the promo card; four from `lg`, three from
 * `md`, two from `sm`, and 70% of a phone's width so the next card peeks in.
 * Each width is short by its share of the 1rem gaps (four gaps between five).
 * A fixed width, not a minimum, so a long name cannot push a card wider.
 */
const SLIDE =
  "flex shrink-0 snap-start flex-col w-[70vw] sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] xl:w-[calc(20%-0.8rem)]";

const ARROW =
  "flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-900 transition-colors duration-200 hover:border-amber-500 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-amber-400/20 dark:bg-transparent dark:text-amber-200 dark:hover:border-amber-300";

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
 * "%10 SultanPuan": the loyalty programme's own row on the homepage — the gold
 * card of the advantages section on the left (the rate, and the band it is
 * earned in, both live from "Parametreler"), and beside it, sliding sideways,
 * every product whose price alone lands an order in that band.
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
    <section aria-labelledby={headingId} className="w-full py-10">
      <div className={`${PAGE_CONTAINER} grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-stretch`}>
        {/* The promo card: the advantages section's gold, as tall as the cards
            beside it, its arrows at the foot. The same insets as the track
            (room for the cards' shadow), so the two start and end level. */}
        <div className="lg:pt-2 lg:pb-6">
          <div className={`group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border p-5 shadow-sm ${SURFACE.gold}`}>
            <div className="flex items-start justify-between gap-3">
              <p className={`${LABEL} text-amber-700 dark:text-amber-400`}>Sadakat Programı</p>
              <Coin />
            </div>
            <h2 id={headingId} className="mt-3">
              <span className={`${FIGURE} ${GOLD} block text-4xl md:text-5xl`}>{rate}</span>
              <span className="mt-1 block text-xl font-extrabold tracking-tight text-amber-950 dark:text-amber-100">
                SultanPuan
              </span>
            </h2>
            <p className="mt-2 text-[13px] font-semibold text-amber-800 tabular-nums dark:text-amber-200/80">
              {band} alışverişlerde
            </p>
            <p className="mt-2 text-xs leading-snug text-amber-900/70 dark:text-amber-100/60">
              Puanınız sonraki alışverişinizde indirim olur.
            </p>
            <div className="mt-auto flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => slide(-1)}
                disabled={ends.start}
                aria-label="Önceki ürünler"
                className={ARROW}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => slide(1)}
                disabled={ends.end}
                aria-label="Sonraki ürünler"
                className={ARROW}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
              <span className="ml-auto text-[11px] font-semibold text-amber-800/70 tabular-nums dark:text-amber-200/60">
                {products.length} ürün
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden">
          {/* The top padding keeps the cards' shadow from being clipped: a
              sideways scroller clips vertically too. */}
          <ul
            ref={track}
            onScroll={measure}
            className="flex w-full snap-x snap-mandatory flex-row flex-nowrap gap-4 overflow-x-auto scroll-smooth pt-2 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
