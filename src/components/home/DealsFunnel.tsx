"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, ChevronLeft, ChevronRight, Package } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { useNow } from "@/hooks/useNow";
import { fetchFlashSaleProducts } from "@/lib/catalogApi";
import { saleState } from "@/lib/flashSale";
import { productHref, productImageAlt } from "@/lib/seo";
import { displayVariant, soldOut as allSoldOut } from "@/lib/variants";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogPrice, CatalogProduct, Category } from "@/types";

/**
 * "FIRSATLARI KAÇIRMA": the deals section, and the only one the page has.
 *
 * The look is carried over from sultannargile.com's own `src/sections/Funnel.tsx`
 * — near-black, three stacked background layers (two radial washes, a
 * diagonal sheen, a masked 52px grid), rising smoke, and a centred title — as
 * a band across the full width of the page rather than a card in its column.
 * What sits inside is this shop's own: the live deals, each a white card whose
 * photo runs flush across the top of it, in a cover flow across the page's
 * container — the cards in the middle at full size, the ones peeking in at
 * the edges smaller and dimmed.
 *
 * It renders only while there is something to show. A dark panel announcing
 * deals with nothing in it is worse than no panel, so with no claimable deal
 * the section is not there at all — and `#firsat-urunleri`, which the menu
 * points at, lands on whatever follows.
 *
 * "Claimable" is read off what the server sent (a sale attached to a colour),
 * never off the clock, so the row cannot change length under the visitor. A
 * deal whose deadline passes while the page is open keeps its card and says
 * "Fırsat Kaçtı" at its regular price, which is also what checkout will
 * charge.
 *
 * `#fa5f6c` is that site's ruby-400 and `rgba(183,10,33,…)` its glow; they are
 * written as values rather than tokens because they belong to this one section.
 */

/** Where the smoke rises from, as percentages across the card. */
const SMOKE = [12, 38, 64, 86];
/**
 * A cover flow: a snapping track whose cards stop at its centre, with the
 * cards either side of the middle peeking in at the edges — where a swipe, a
 * trackpad or the arrows bring them in. Every live deal is on it; slicing the
 * list to what fits would quietly hide deals from the one section that exists
 * to show them.
 *
 * A card is `--card` of the track: 64% on a phone and 46% from `sm`, so one
 * card holds the middle with the next showing either side (wide enough to see
 * once it is scaled down), and 26% from `lg`, so three do. The spacers before the first card and after the last are half
 * of what is left, less a gap, so the end cards can come to the centre too.
 * The faded edges are a mask, as on the brand ticker.
 */
const TRACK = [
  "relative flex snap-x snap-mandatory gap-[var(--gap)] overflow-x-auto scroll-smooth py-3",
  "[--gap:1rem] sm:[--gap:1.5rem] [--card:64%] sm:[--card:46%] lg:[--card:26%]",
  "before:w-[calc((100%-var(--card))/2-var(--gap))] before:shrink-0 before:content-['']",
  "after:w-[calc((100%-var(--card))/2-var(--gap))] after:shrink-0 after:content-['']",
  "[mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]",
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
].join(" ");
/** The depth: in focus, full size and full strength; peeking, smaller and dimmed. The change eases either way. */
const SLIDE = "flex w-[var(--card)] min-w-0 shrink-0 snap-center transition-all duration-500 ease-out motion-reduce:transition-none";
const IN_FOCUS = "scale-100 opacity-100";
const PEEKING = "scale-[0.85] opacity-60";

/**
 * Which cards are in focus: every one the track shows whole, and whichever is
 * nearest its centre even mid-swipe, when a phone may show none whole.
 *
 * Measured off the layout (`offsetLeft`, `offsetWidth`) against the scroll
 * position, not off what is painted: a card scaled down for peeking is smaller
 * on screen, and measuring that would bring it back into focus.
 */
function cardsInFocus(track: HTMLElement): Set<number> {
  const left = track.scrollLeft;
  const right = left + track.clientWidth;
  const middle = (left + right) / 2;
  const focus = new Set<number>();
  let nearest = -1;
  let nearestDistance = Infinity;
  Array.from(track.children as HTMLCollectionOf<HTMLElement>).forEach((card, index) => {
    const start = card.offsetLeft;
    const end = start + card.offsetWidth;
    if (start >= left - 1 && end <= right + 1) focus.add(index);
    const distance = Math.abs((start + end) / 2 - middle);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = index;
    }
  });
  if (nearest >= 0) focus.add(nearest);
  return focus;
}

const sameSet = (a: Set<number>, b: Set<number>) => a.size === b.size && [...a].every((i) => b.has(i));
/**
 * One white body, and the photo's canvas is the same white: nothing to see
 * between them, which is what the flush layout was for. The product reads as
 * the top of the card and the type sits on the same sheet beneath it.
 *
 * No padding on the shell — the canvas needs the card's own edges to sit
 * against, so the padding belongs to the text block below it.
 *
 * On hover it lifts and the shadow turns ruby. `hover:` rather than
 * `group-hover:` for the card's own state: the group selector reaches
 * descendants, not the element that declares it.
 */
const CARD = [
  "group relative flex h-full w-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl",
  "border border-white/20 bg-white shadow-xl",
  "transition-all duration-300 hover:border-red-400/60",
  "hover:shadow-[0_20px_45px_rgba(216,16,40,0.3)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  "motion-safe:hover:-translate-y-2",
].join(" ");

interface DealsFunnelProps {
  /** Live deals, server-rendered at anonymous (RETAIL) prices. */
  initialProducts: CatalogProduct[];
  categories: Category[];
  /** The heading and the line under it, from "Ana Sayfa Düzenleme". */
  title: string;
  subtitle: string;
}

/** How much off, from the price shown against what it was. 0 = no saving. */
function savingPercent(now: CatalogPrice | null, was: CatalogPrice | null): number {
  if (!now || !was) return 0;
  const before = Number(was.price_incl_tax);
  if (!(before > 0)) return 0;
  return Math.round((1 - Number(now.price_incl_tax) / before) * 100);
}

export function DealsFunnel({ initialProducts, categories, title, subtitle }: DealsFunnelProps) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const money = useDisplayMoney();
  const now = useNow(true);
  const [own, setOwn] = useState<{ token: string; products: CatalogProduct[] } | null>(null);
  const track = useRef<HTMLUListElement>(null);
  // Null until measured: the server's render, and the first paint, show every card in focus.
  const [focus, setFocus] = useState<Set<number> | null>(null);
  const centred = useRef(false);

  /** One card and one gap, measured off the track rather than assumed. */
  function slide(direction: 1 | -1) {
    const element = track.current;
    const card = element?.firstElementChild as HTMLElement | undefined;
    if (!element || !card) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  }

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchFlashSaleProducts(controller.signal)
      .then((products) => setOwn({ token, products }))
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setOwn({ token, products: initialProducts });
      });
    return () => controller.abort();
  }, [hydrated, token, initialProducts]);

  // An empty answer is not an answer here: the list stands and its prices stay
  // masked rather than the section emptying out under the visitor.
  const mine = own && own.token === token && own.products.length > 0 ? own.products : null;
  const loggedIn = hydrated && !!token;
  const products = (loggedIn ? (mine ?? initialProducts) : initialProducts).filter(
    (p) => p.is_opportunity && p.variants.some((v) => v.flash_sale),
  );
  const count = products.length;

  // The flow opens on the middle deal, so both sides have cards to peek in —
  // once, on the first render that has a track, without the smooth scroll.
  useEffect(() => {
    const element = track.current;
    if (!element || centred.current) return;
    const card = element.children[Math.floor(element.children.length / 2)] as HTMLElement | undefined;
    if (!card) return;
    centred.current = true;
    element.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - element.clientWidth / 2, behavior: "instant" });
  }, [count]);

  // Re-read which cards are in focus as the track scrolls or resizes, at most once a frame.
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const next = cardsInFocus(element);
      setFocus((current) => (current && sameSet(current, next) ? current : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    element.addEventListener("scroll", schedule, { passive: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", schedule);
      resize.disconnect();
    };
  }, [count]);

  if (count === 0) return null;
  const publicPrices = !mine;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <section
      id="firsat-urunleri"
      aria-labelledby="deals-funnel-heading"
      className="relative isolate scroll-mt-[var(--header-height)] overflow-hidden bg-[#0a0a0c] py-12 text-white sm:py-16"
    >
      {/* Background, edge to edge: two washes, a diagonal sheen, a grid
          masked to the middle, and smoke rising off the floor. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(216,16,40,0.55),transparent_58%),radial-gradient(ellipse_at_bottom_right,rgba(150,10,30,0.5),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:52px_52px] opacity-[0.14] [mask-image:radial-gradient(ellipse_at_center,#000,transparent_72%)]" />
        {SMOKE.map((left, index) => (
          <span
            key={left}
            className="absolute bottom-8 h-20 w-20 rounded-full bg-white/10 blur-2xl motion-safe:animate-smoke motion-reduce:hidden"
            style={
              {
                left: `${left}%`,
                "--smoke-dur": `${6 + index * 1.4}s`,
                animationDelay: `${index * 1.3}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="px-6 sm:px-10">
          <div className="relative text-center">
            <h2
              id="deals-funnel-heading"
              // One line, which is what took the row's height back: two lines
              // of 46px pushed the cards below the fold on a laptop. The type
              // is font-semibold, like the hero and the advantages heading —
              // the original site set this in Roboto Black, which in Geist
              // comes out as a different voice from the rest of the storefront.
              //
              // `bg-clip-text` paints the gradient across the element's own
              // box, so anything a glyph puts outside it — the cedilla under
              // the Ç — gets no paint and vanishes. The line-height and the
              // padding below give the tail somewhere to be.
              className={[
                "whitespace-nowrap pb-1.5 text-xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl",
                // Brushed titanium, lit from one side: zinc at both ends, a
                // white band through the middle, and the whole ramp two and a
                // half times the width of the text so there is somewhere for
                // it to travel. `inline-block` is what gives the background a
                // box of its own to be positioned within.
                "inline-block bg-[linear-gradient(110deg,#71717a_20%,#e4e4e7_40%,#ffffff_50%,#e4e4e7_60%,#71717a_80%)]",
                "bg-[length:250%_100%] bg-clip-text text-transparent",
                // The sweep itself: 4s, linear, and only for a visitor who has
                // not asked for less motion.
                "motion-safe:animate-chrome-sweep",
                // One filter, two shadows: the dark one cuts the letters out
                // of the crimson behind them, the white one is the bloom off
                // the metal. Two `drop-shadow-*` utilities would not stack —
                // the second would replace the first.
                "[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.6))_drop-shadow(0_0_18px_rgba(255,255,255,0.14))]",
              ].join(" ")}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mx-auto mt-1 max-w-lg text-[13px] leading-relaxed text-white/70">{subtitle}</p>
            )}

            {/* Only when there is a second card to bring to the centre: a
                control that cannot do anything is worse than no control. A
                touch screen scrolls the track itself, and sees the next card
                peeking at the edge, so these are for the pointer. */}
            {count > 1 && (
              <div className="absolute right-0 top-1 hidden gap-2 lg:flex">
                {([-1, 1] as const).map((direction) => (
                  <button
                    key={direction}
                    type="button"
                    onClick={() => slide(direction)}
                    aria-label={direction === -1 ? "Önceki fırsatlar" : "Sonraki fırsatlar"}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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

        {/* The track runs the container's full width, past the heading's
            inset, so the peeking cards reach its edges. */}
        <ul ref={track} className={`mt-5 ${TRACK}`}>
          {products.map((product, index) => {
            const variant = displayVariant(product);
            const sale = saleState(product, variant, now);
            const regular = variant?.price ?? null;
            // The sale price while one is claimable, the regular one after.
            const price = sale.kind === "live" ? sale.price : regular;
            // "Was": the viewer's own regular price during a sale, else the
            // public RETAIL price — the same rule the catalog card follows.
            const was = sale.kind === "live" ? regular : (variant?.list_price ?? null);
            const saving = savingPercent(price, was);
            const gone = allSoldOut(product);
            const category = product.category_id != null ? categoryById.get(product.category_id) : undefined;

            return (
              <li key={product.id} className={`${SLIDE} ${!focus || focus.has(index) ? IN_FOCUS : PEEKING}`}>
                <Link href={productHref(product)} className={CARD}>
                  {/* The photo's canvas: flush to the card's top and sides,
                      and the same white as the card, so there is no seam to
                      find. The photos are opaque JPEGs shot on white, which is
                      exactly why a white card carries them with no frame, no
                      plate and no blend trick. The card's own
                      `overflow-hidden` rounds the corners. */}
                  <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-white p-3">
                    <div className="relative h-full w-full">
                      <ProductImage
                        src={product.image_url}
                        alt={productImageAlt(product, category)}
                        sizes="(min-width: 1280px) 320px, (min-width: 1024px) 25vw, (min-width: 640px) 44vw, 62vw"
                        surfaceClassName="bg-transparent"
                        imageClassName="h-full w-full object-contain transition-transform duration-300 motion-safe:group-hover:scale-[1.08]"
                        fallback={
                          <div className="flex h-full items-center justify-center text-neutral-300">
                            <Package className="h-10 w-10" strokeWidth={1} aria-hidden />
                          </div>
                        }
                      />
                    </div>

                    {sale.kind === "missed" ? (
                      <span className="absolute left-3 top-3 z-10 rounded-lg bg-neutral-800 px-2.5 py-1 text-[11px] font-bold tracking-wider text-neutral-200 shadow-md">
                        Fırsat Kaçtı
                      </span>
                    ) : (
                      <span className="absolute left-3 top-3 z-10 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white shadow-md">
                        {saving > 0 ? `-%${saving}` : "Fırsat"}
                      </span>
                    )}
                  </div>

                  {/* Everything else sits on the same white sheet, in its own padding. */}
                  <div className="flex flex-1 flex-col justify-between space-y-3 bg-white p-4">
                    <div>
                      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        {category?.name ?? "Fırsat ürünü"}
                      </p>
                      <h3
                        className="mt-1 line-clamp-2 min-h-10 text-[15px] font-medium leading-5 tracking-tight text-foreground transition-colors duration-200 group-hover:text-red-600"
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                    </div>

                    {/* h-11 is the two lines it can hold — a struck price of
                        text-xs over a deal price of text-lg — so the row is
                        the same height with one line or two, and the switch
                        from public to the visitor's own prices moves nothing. */}
                    <div className={`flex h-11 flex-col justify-center ${publicPrices ? "public-price" : ""}`}>
                      {gone ? (
                        <span className="text-sm font-semibold tracking-tight text-neutral-500">Tükendi</span>
                      ) : (
                        <>
                          {saving > 0 && was && (
                            <span className="text-xs font-medium text-neutral-400 line-through">
                              {money.format(was)}
                            </span>
                          )}
                          <span className="text-lg font-semibold leading-7 tracking-tight text-red-600">
                            {price ? money.format(price) : "—"}
                          </span>
                        </>
                      )}
                    </div>

                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-red-600/30 transition-all duration-200 group-hover:bg-red-700">
                      İncele
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
                        strokeWidth={2.5}
                        aria-hidden
                      />
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
