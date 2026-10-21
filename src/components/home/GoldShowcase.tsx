"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { GoldCoinBadge } from "@/components/home/GoldCoinBadge";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { PAGE_CONTAINER } from "@/lib/layout";
import { retailPerks } from "@/lib/perks";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

/**
 * Five across from `xl`; four from `lg`, three from
 * `md`, two from `sm`, and 70% of a phone's width so the next card peeks in.
 * Each width is short by its share of the 1rem gaps (four gaps between five).
 * A fixed width, not a minimum, so a long name cannot push a card wider.
 */
const SLIDE =
  "flex shrink-0 snap-start flex-col w-[70vw] sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] xl:w-[calc(20%-0.8rem)]";

/** How long each page of cards is shown before the row moves on by itself. */
const AUTOPLAY_MS = 3000;

/** An arrow's shape; its colours are the tone's. */
const ARROW =
  "flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-transparent";

/**
 * The band's ground and the type that sits on it, as two tones. The title,
 * the call, the coins and the cards are the same in both.
 * - `gold`: a warm gold behind the header, fading to white as the cards
 *   begin; gold-brown lines and arrows. The Kumbara band.
 * - `silver`: a soft zinc-50 → zinc-100 ground under the whole band, no
 *   yellow at all; neutral lines and arrows, and the white cards lifted off
 *   the grey by a soft shadow. The SultanPuan band, matching the light
 *   "Fırsatları Kaçırma".
 */
const TONES = {
  gold: {
    band: "bg-gradient-to-b from-amber-100 from-0% to-white to-35% dark:from-amber-400/[0.12] dark:to-transparent",
    subtitle: "text-amber-800 dark:text-amber-200/80",
    note: "text-amber-900/80 dark:text-amber-100/70",
    count: "text-amber-800/70 dark:text-amber-200/60",
    arrow:
      "border-amber-200 text-amber-900 hover:border-amber-500 focus-visible:outline-amber-600 dark:border-amber-400/20 dark:text-amber-200 dark:hover:border-amber-300",
    card: "",
  },
  silver: {
    band: "bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-white/[0.03] dark:to-transparent",
    subtitle: "text-zinc-600 dark:text-zinc-300",
    note: "text-zinc-700 dark:text-zinc-300",
    count: "text-zinc-500 dark:text-zinc-400",
    arrow:
      "border-zinc-200 text-zinc-800 shadow-sm hover:border-zinc-400 focus-visible:outline-zinc-900 dark:border-white/15 dark:text-zinc-200 dark:hover:border-white/40",
    card: "[&>article]:shadow-sm",
  },
} as const;

/** The small minted coin on each card: the advantages section's, card-sized. */
const CARD_COIN =
  "pointer-events-none absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-[9px] font-bold tracking-tight text-amber-950/80 shadow-[0_6px_14px_-6px_rgba(217,119,6,0.6)] ring-1 ring-inset ring-white/50";

/**
 * A loyalty band on the homepage — "%10 SultanPuan", "Kumbara 20.000 TL": a
 * band edge to edge (gold or silver, `tone`), the offer across its top in three parts (the title
 * over its line, a note in the middle, the call by the coin), and under it a
 * row of products sliding sideways by itself, each marked with the SP coin.
 * The two bands are this one component, so they cannot drift apart; each
 * brings only its words and its products.
 *
 * Sultan Puan is a retail perk: a signed-in B2B account (which cannot earn it)
 * does not see the band; a visitor, a retail customer and the panel's staff do.
 * The cards are re-priced for a signed-in visitor, as everywhere on the page.
 */
export function GoldShowcase({
  title,
  subtitle,
  note,
  call,
  products,
  categories,
  tone = "gold",
}: {
  /** The <h2>'s content: a gold figure and a word, in either order. */
  title: ReactNode;
  /** Under the title, small and gold. */
  subtitle: ReactNode;
  /** In the middle, between the title and the call. */
  note: ReactNode;
  /** At the right, beside the coin. */
  call: string;
  products: CatalogProduct[];
  categories: Category[];
  /** The band's ground and lines (TONES). */
  tone?: keyof typeof TONES;
}) {
  const headingId = useId();
  const colours = TONES[tone];
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

  // The row turns its pages by itself — a whole page every AUTOPLAY_MS, back to
  // the first after the last — but not while the visitor is at it: a pointer
  // over the cards or the arrows, a finger on them, or the keyboard in them
  // holds it, and the count starts over when they let go. Never for a visitor
  // who asks for reduced motion.
  const [hovered, setHovered] = useState(false);
  const [touching, setTouching] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const held = hovered || touching || keyboard;

  useEffect(() => {
    if (held || !track.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const el = track.current;
      const card = el?.firstElementChild as HTMLElement | undefined;
      if (!el || !card) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
        el.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      // A page is as many whole cards as are in view (five on a desktop, one
      // on a phone), so the snap lands it on a card's edge, not between two.
      // The cards' widths are fractional: five fill the view to within a
      // pixel, so the count is floored with that pixel's grace.
      const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      const perPage = Math.max(1, Math.floor((el.clientWidth + gap + 1) / step));
      el.scrollBy({ left: perPage * step, behavior: "smooth" });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [held, products.length]);

  /** One card and one gap, measured off the track rather than assumed. */
  function slide(direction: 1 | -1) {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !card) return;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  }

  if (products.length === 0) return null;
  if (loggedIn && user && !retailPerks(user) && !isAdminRole(user.role)) return null;

  return (
    // The whole band in its tone, edge to edge (TONES).
    <section aria-labelledby={headingId} className={`w-full py-10 md:py-12 ${colours.band}`}>
      <div className={PAGE_CONTAINER}>
        {/* The offer in three parts: the rate over its band, what the
            points do, the call and the coin. From `lg` one row, the note
            truly centred between the two ends; from `sm` the two ends share
            a row with the note under them; on a phone all three stack. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="min-w-0">
            <h2 id={headingId} className="flex flex-wrap items-baseline gap-x-2">
              {title}
            </h2>
            <p className={`mt-1 text-sm font-semibold tabular-nums ${colours.subtitle}`}>{subtitle}</p>
          </div>
          <p className={`text-sm font-medium sm:col-span-2 sm:row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:text-center md:text-base ${colours.note}`}>
            {note}
          </p>
          <div className="flex shrink-0 items-center gap-3 sm:col-start-2 sm:row-start-1 sm:justify-self-end lg:col-start-3">
            <p className="text-base font-extrabold tracking-tight text-black md:text-lg dark:text-white">
              {call}
            </p>
            <GoldCoinBadge />
          </div>
        </div>

        {/* The cards and their arrows: what holds the row still while in use. */}
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onTouchStart={() => setTouching(true)}
          onTouchEnd={() => setTouching(false)}
          onTouchCancel={() => setTouching(false)}
          onFocus={(e) => setKeyboard(e.target.matches(":focus-visible"))}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKeyboard(false);
          }}
        >
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
                  <div className={`relative flex w-full flex-1 flex-col [&>article]:flex-1 ${colours.card}`}>
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
            <span className={`text-xs font-semibold tabular-nums ${colours.count}`}>
              {products.length} ürün
            </span>
            <button type="button" onClick={() => slide(-1)} disabled={ends.start} aria-label="Önceki ürünler" className={`${ARROW} ${colours.arrow}`}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => slide(1)} disabled={ends.end} aria-label="Sonraki ürünler" className={`${ARROW} ${colours.arrow}`}>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
