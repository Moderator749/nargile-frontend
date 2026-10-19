"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, ChevronLeft, ChevronRight, Package } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { useNow } from "@/hooks/useNow";
import { fetchFlashSaleProducts } from "@/lib/catalogApi";
import { DEALS_HREF, saleState } from "@/lib/flashSale";
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
 * photo runs flush across the top of it, in an endless cover flow across the
 * page's container — the cards in the middle at full size, the ones peeking in
 * at the edges smaller and dimmed.
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
 * An endless cover flow: a snapping track with `--n` cards in focus — four on
 * a desktop, two from `sm`, one on a phone — each `--card` of the track wide
 * and `--gap` apart, and the next card peeking in at either edge. The snap
 * padding is half of what those cards leave, so the first of them stops there
 * and the rest of that half is the peek's. Every live deal is on it; slicing
 * the list to what fits would quietly hide deals from the one section that
 * exists to show them.
 *
 * The edges fade, as on the brand ticker, but only by a sliver, or the
 * peeking cards would fade out altogether.
 */
const TRACK = [
  "relative flex snap-x snap-mandatory gap-[var(--gap)] overflow-x-auto scroll-smooth py-3",
  "[--n:1] [--card:64%] [--gap:1rem] sm:[--n:2] sm:[--card:36%] sm:[--gap:1.5rem] lg:[--n:4] lg:[--card:19.5%] xl:[--gap:2rem]",
  // While the loop moves the track by a set, nothing may ease: the cards that
  // take over the same places must arrive in their state, not grow into it.
  "[&[data-jumping]>li]:transition-none",
  "[mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]",
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
].join(" ");
/** Where the first card in focus stops: the `--n` cards and their gaps, centred. */
const SNAP_PADDING: CSSProperties = {
  scrollPaddingInline: "calc((100% - var(--n) * var(--card) - (var(--n) - 1) * var(--gap)) / 2)",
};
/**
 * The depth, as `placeCards` marks each card: in focus (or not measured yet),
 * full size and full strength; peeking, 85% and dimmed. A peeking card shrinks
 * towards its edge nearer the middle, so the sliver of it at the edge of the
 * track stays as wide as it was. The change eases either way.
 */
const SLIDE = [
  "flex w-[var(--card)] min-w-0 shrink-0 snap-start transition-all duration-500 ease-out motion-reduce:transition-none",
  "data-[pos=left]:origin-right data-[pos=left]:scale-[0.85] data-[pos=left]:opacity-60",
  "data-[pos=right]:origin-left data-[pos=right]:scale-[0.85] data-[pos=right]:opacity-60",
].join(" ");
const ARROW =
  "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white shadow-lg shadow-black/40 backdrop-blur-sm transition-colors duration-200 hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Marks each card `data-pos`: "focus" for every one the track shows whole,
 * and for whichever is nearest its centre even mid-swipe, when a phone may
 * show none whole; "left" or "right" for the rest, by the side they are on.
 *
 * Written straight onto the elements rather than through state, so a scroll
 * re-renders nothing, and so the loop can re-mark the cards in the same moment
 * it moves the track. Measured off the layout (`offsetLeft`, `offsetWidth`),
 * not off what is painted: a card scaled down for peeking is smaller on
 * screen, and measuring that would bring it back into focus.
 */
function placeCards(track: HTMLElement) {
  const left = track.scrollLeft;
  const right = left + track.clientWidth;
  const middle = (left + right) / 2;
  const cards = Array.from(track.children as HTMLCollectionOf<HTMLElement>);
  let nearest: HTMLElement | undefined;
  let nearestDistance = Infinity;
  const places = cards.map((card) => {
    const start = card.offsetLeft;
    const end = start + card.offsetWidth;
    const centre = (start + end) / 2;
    const distance = Math.abs(centre - middle);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = card;
    }
    return start >= left - 1 && end <= right + 1 ? "focus" : centre < middle ? "left" : "right";
  });
  cards.forEach((card, index) => {
    const place = card === nearest ? "focus" : places[index];
    if (card.dataset.pos !== place) card.dataset.pos = place;
  });
}

/**
 * How many copies of the deals the loop runs on: the real ones in the middle
 * and, either side, at least a dozen cards — more than a swipe or a run of
 * clicks covers before the track settles and is brought back.
 */
const loopCopies = (count: number) => 2 * Math.ceil(12 / count) + 1;

/** The scroll position that stops `card` first in focus: the snap padding's arithmetic, in pixels. */
function stopFor(track: HTMLElement, card: HTMLElement): number {
  const style = getComputedStyle(track);
  const n = Number.parseInt(style.getPropertyValue("--n"), 10) || 1;
  const gap = Number.parseFloat(style.columnGap) || 0;
  return card.offsetLeft - (track.clientWidth - n * card.offsetWidth - (n - 1) * gap) / 2;
}

/**
 * The loop. Once the track has settled more than half a set away from the
 * real deals, it is moved back (or on) by whole sets — to the same picture,
 * every copy being the same — with the easing off and the cards re-marked
 * at once, so nothing is seen to move or change.
 */
function recentre(track: HTMLElement, count: number, copies: number) {
  const cards = track.children as HTMLCollectionOf<HTMLElement>;
  const home = cards[Math.floor(copies / 2) * count];
  if (!home || !cards[count]) return;
  const set = cards[count].offsetLeft - cards[0].offsetLeft;
  const offset = track.scrollLeft - stopFor(track, home);
  const wrapped = ((((offset + set / 2) % set) + set) % set) - set / 2;
  if (Math.abs(wrapped - offset) < 1) return;
  track.dataset.jumping = "";
  track.scrollTo({ left: track.scrollLeft + wrapped - offset, behavior: "instant" });
  placeCards(track);
  void track.offsetWidth; // the new marks take effect while the easing is still off
  requestAnimationFrame(() => delete track.dataset.jumping);
}

/** True in the browser once hydrated, false on the server and while hydrating. */
const subscribeNothing = () => () => {};
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
  /** An arrow's move (`data-direction`): one card and one gap, measured off the track rather than assumed. */
  const slide = (event: MouseEvent<HTMLButtonElement>) => {
    const element = track.current;
    const card = element?.firstElementChild as HTMLElement | undefined;
    if (!element || !card) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({ left: Number(event.currentTarget.dataset.direction) * (card.offsetWidth + gap), behavior: "smooth" });
  };
  const client = useSyncExternalStore(subscribeNothing, () => true, () => false);

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchFlashSaleProducts(controller.signal)
      .then((products) => setOwn({ token, products }))
      .catch((err: unknown) => {
        // Not the guest's copies (retail stock and prices): an empty answer,
        // which keeps the list masked as below.
        if (!axios.isCancel(err)) setOwn({ token, products: [] });
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

  // The copies are the browser's alone: the server sends each deal once, so a
  // crawler reads each link once, and the loop is laid out on hydrating. A
  // single deal has nothing to loop through.
  const loops = client && count > 1;
  const copies = loops ? loopCopies(count) : 1;
  const home = Math.floor(copies / 2);

  // The flow opens on the real deals, the first of them first in focus, and
  // with copies already peeking in at both edges — before the first paint.
  useLayoutEffect(() => {
    const element = track.current;
    const first = element?.children[home * count] as HTMLElement | undefined;
    if (!element || !loops || !first) return;
    element.scrollTo({ left: stopFor(element, first), behavior: "instant" });
    placeCards(element);
  }, [loops, home, count]);

  // Re-mark the cards as the track scrolls or resizes, at most once a frame;
  // and once it has settled — not while a finger is still on it — bring the
  // loop back towards the real deals.
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    let settle = 0;
    let touching = false;
    const measure = () => {
      frame = 0;
      placeCards(element);
    };
    const settled = () => {
      if (loops && !touching) recentre(element, count, copies);
    };
    const waitToSettle = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(settled, 150);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
      waitToSettle();
    };
    const onTouchStart = () => {
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
      waitToSettle();
    };
    onScroll();
    element.addEventListener("scroll", onScroll, { passive: true });
    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchend", onTouchEnd, { passive: true });
    element.addEventListener("touchcancel", onTouchEnd, { passive: true });
    const resize = new ResizeObserver(onScroll);
    resize.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", onTouchEnd);
      resize.disconnect();
    };
  }, [loops, count, copies]);

  if (count === 0) return null;
  const publicPrices = !mine;
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const slides = Array.from({ length: copies }, (_, copy) => products.map((product) => ({ product, copy }))).flat();

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
          <div className="text-center">
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
          </div>
        </div>

        {/* The track runs the container's full width, past the heading's
            inset, so the peeking cards reach its edges; the arrows float over
            those edges, one card a click, round and round. */}
        <div className="relative mt-5">
          {count > 1 &&
            ([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                data-direction={direction}
                onClick={slide}
                aria-label={direction === -1 ? "Önceki fırsatlar" : "Sonraki fırsatlar"}
                className={`${ARROW} ${direction === -1 ? "left-2" : "right-2"}`}
              >
                {direction === -1 ? (
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                ) : (
                  <ChevronRight className="h-5 w-5" aria-hidden />
                )}
              </button>
            ))}
          <ul ref={track} style={SNAP_PADDING} className={`${TRACK} ${count === 1 ? "justify-center" : ""}`}>
            {slides.map(({ product, copy }) => {
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
                // The copies are there to be seen, not read twice or tabbed
                // through: the real deals are the list.
                <li key={`${copy}-${product.id}`} aria-hidden={copy !== home || undefined} className={SLIDE}>
                  <Link href={productHref(product)} tabIndex={copy !== home ? -1 : undefined} className={CARD}>
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
                          sizes="(min-width: 1280px) 240px, (min-width: 1024px) 19vw, (min-width: 640px) 34vw, 62vw"
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
                        {/* Ink of its own: the card is white in either theme. */}
                        <h3
                          className="mt-1 line-clamp-2 min-h-10 text-[15px] font-medium leading-5 tracking-tight text-neutral-900 transition-colors duration-200 group-hover:text-red-600"
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

        {/* The way on to every deal, as a grid of its own: centred under the
            flow, in the ruby of the cards' own buttons; the whole width of a
            phone, its own width from `sm`. */}
        <div className="mt-8 flex justify-center px-6 sm:mt-10 sm:px-0">
          <Link
            href={DEALS_HREF}
            className="group/cta inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-red-600 px-8 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-red-600/30 ring-1 ring-inset ring-white/15 transition-all duration-200 hover:bg-red-700 hover:shadow-[0_12px_32px_rgba(216,16,40,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto sm:max-w-none"
          >
            Fırsatları Gör
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover/cta:translate-x-1"
              strokeWidth={2.5}
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
