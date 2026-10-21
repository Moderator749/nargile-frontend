"use client";

import Link from "next/link";
import { ArrowRight, Dices } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { ShowcasePrice } from "@/components/home/ShowcasePrice";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { GAMES_CATEGORY_SLUG, type GameGroup, type GamesShowcaseData } from "@/lib/homeShowcases";
import { PAGE_CONTAINER } from "@/lib/layout";
import { productHref, productImageAlt } from "@/lib/seo";
import type { CatalogProduct } from "@/types";

/** Red suits print red. */
const RED_SUITS = new Set(["♥", "♦"]);

/**
 * The hand: the outer cards lean out and sit a little lower, the middle one
 * stands tall — from `md`, where there is room to fan. Under the pointer a
 * card straightens and lifts out of the hand.
 */
const FAN = [
  "md:-rotate-6 md:translate-y-6 md:origin-bottom-right",
  "md:-translate-y-1",
  "md:rotate-6 md:translate-y-6 md:origin-bottom-left",
];

/** A card's corner: its letter over its suit, as a deck prints it. */
function Index({ letter, suit, flipped = false }: { letter: string; suit: string; flipped?: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute flex flex-col items-center font-serif leading-none ${
        RED_SUITS.has(suit) ? "text-red-600" : "text-stone-900"
      } ${flipped ? "right-3 bottom-3 rotate-180" : "left-3 top-3"}`}
    >
      <span className="text-xl font-bold">{letter}</span>
      <span className="text-base">{suit}</span>
    </span>
  );
}

function GameCard({ game, own, lean }: { game: GameGroup; own: Map<string, CatalogProduct> | null; lean: string }) {
  const letter = game.label.charAt(0);
  return (
    <li className={`w-[68vw] max-w-[17rem] shrink-0 snap-center transition-transform duration-500 ease-out sm:w-60 md:w-auto md:max-w-none md:flex-1 ${lean} motion-safe:md:hover:z-10 motion-safe:md:hover:-translate-y-4 motion-safe:md:hover:rotate-0`}>
      <Link
        href={`/catalog/${GAMES_CATEGORY_SLUG}?q=${encodeURIComponent(game.key)}`}
        className="group relative flex aspect-[5/7] flex-col rounded-[1.25rem] bg-[#fbf8f1] p-4 text-stone-900 shadow-[0_24px_50px_-20px_rgb(0_0_0/0.6)] ring-1 ring-black/10 transition-shadow duration-500 hover:shadow-[0_36px_70px_-24px_rgb(0_0_0/0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 sm:p-5"
      >
        <Index letter={letter} suit={game.suit} />
        <Index letter={letter} suit={game.suit} flipped />
        {/* The court card's frame, the set's photograph inside it. */}
        <div className="relative mx-5 mt-7 flex-1 overflow-hidden rounded-xl border border-stone-300/80 bg-white sm:mx-6">
          <ProductImage
            src={game.cover.image_url}
            alt={productImageAlt(game.cover, { name: "Oyun & Eğlence" })}
            fallback={<Dices className="m-auto h-10 w-10 text-stone-300" strokeWidth={1.25} aria-hidden />}
            sizes="(min-width: 768px) 260px, 60vw"
            imageClassName="object-contain p-3 mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
            surfaceClassName="bg-white"
          />
        </div>
        <div className="mx-5 mt-3 mb-6 text-center sm:mx-6">
          <h3 className="font-serif text-2xl font-semibold tracking-tight">{game.label}</h3>
          <p className="mt-0.5 text-xs text-stone-500">{game.tagline}</p>
          <p className="mt-2 text-xs text-stone-600">
            <span className="font-semibold tabular-nums">{game.count} model</span>
            <span aria-hidden> · </span>
            <ShowcasePrice product={game.cheapest} own={own} prefix="en uygun" className="gap-x-1 font-mono text-xs" />
          </p>
        </div>
      </Link>
    </li>
  );
}

/**
 * "Oyun & Eğlence": the game table. A deep green felt band with a fine weave
 * and a dark vignette, gold hairlines at its edges. The games — tavla, okey,
 * iskambil — are three oversized playing cards, fanned like a hand from `md`
 * (a sideways swipe on a phone), each with its corner indices, the set's
 * photograph in the court frame, how many models and the lowest price; each
 * opens the category searched for that game. Under the hand, "Masanın
 * Yıldızları": the dearest sets as a slim strip.
 * Server-rendered at the public price, re-priced for a signed-in visitor.
 */
export function GamesShowcase({ data }: { data: GamesShowcaseData }) {
  const own = useOwnPrices([...data.games.map((g) => g.cheapest), ...data.stars]);

  return (
    <section aria-labelledby="oyun-baslik" className="relative isolate overflow-hidden bg-[#0d3b2c] py-14 text-emerald-50 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Felt: a fine weave, darker towards the table's edge. */}
        <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:4px_4px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgb(0_0_0/0.45))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
      </div>

      <div className={PAGE_CONTAINER}>
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">
            <Dices className="h-3.5 w-3.5" aria-hidden /> Masaya Bir El Daha
          </p>
          <h2 id="oyun-baslik" className="mt-3 text-4xl font-semibold tracking-tighter text-white sm:text-5xl">
            Oyun & Eğlence
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-emerald-100/80 sm:text-base">
            Tavla, okey ve iskambil: sohbetin en eski, en keyifli ortakları. Kahvehanenin keyfi şimdi masanızda.
          </p>
        </div>

        {/* A swipe on a phone; a fanned hand from md. */}
        <ul className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 [scrollbar-width:none] sm:mt-12 md:mx-auto md:max-w-4xl md:gap-6 md:overflow-visible md:px-0 md:pb-10 lg:gap-8 [&::-webkit-scrollbar]:hidden">
          {data.games.map((game, i) => (
            <GameCard key={game.key} game={game} own={own} lean={data.games.length === 3 ? FAN[i] : ""} />
          ))}
        </ul>

        {data.stars.length > 0 && (
          <div className="mt-8 md:mt-12">
            <div className="flex items-end justify-between gap-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">Masanın Yıldızları</h3>
              <Link
                href={`/catalog/${GAMES_CATEGORY_SLUG}`}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-amber-200 transition-colors hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
              >
                Tüm Oyunlar ({data.total})
                <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.stars.map((p) => (
                <li key={p.id}>
                  <Link
                    href={productHref(p)}
                    className="group flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-inset ring-white/10 transition-colors duration-300 hover:bg-white/[0.1] hover:ring-amber-300/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                  >
                    <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#fbf8f1]">
                      <ProductImage
                        src={p.image_url}
                        alt={productImageAlt(p, { name: "Oyun & Eğlence" })}
                        fallback={<Dices className="m-auto h-6 w-6 text-stone-300" aria-hidden />}
                        sizes="64px"
                        imageClassName="object-contain p-1.5 mix-blend-multiply"
                        surfaceClassName="bg-transparent"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-medium leading-snug text-white">{p.name}</span>
                      <ShowcasePrice
                        product={p}
                        own={own}
                        className="mt-0.5 font-mono text-sm text-amber-200"
                        wasClassName="text-xs text-emerald-200/50"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
