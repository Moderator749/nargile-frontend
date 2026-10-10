"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, Package } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { useNow } from "@/hooks/useNow";
import { fetchFlashSaleProducts } from "@/lib/catalogApi";
import { saleState } from "@/lib/flashSale";
import { productHref } from "@/lib/seo";
import { displayVariant, soldOut as allSoldOut } from "@/lib/variants";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogPrice, CatalogProduct, Category } from "@/types";

/**
 * "FIRSATLARI KAÇIRMA": the deals section, and the only one the page has.
 *
 * The frame is carried over from sultannargile.com's own `src/sections/Funnel.tsx`
 * — a floating near-black card with 28px corners and a red glow thrown
 * downwards, three stacked background layers (two radial washes, a diagonal
 * sheen, a masked 52px grid), rising smoke, and a centred title. What sits
 * inside it is this shop's own: the live deals, five across, each a white
 * card whose photo runs flush across the top of it.
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
 * Five across on a desktop, every column strictly equal: Tailwind's grid-cols-*
 * are `minmax(0,1fr)`, so a card with a short name cannot end up narrower than
 * one with a long name — which is what a flex track, sizing to its content,
 * does. The cells carry `min-w-0` for the same reason: a grid item defaults to
 * `min-width:auto`, and a long unbroken word would otherwise push its column
 * wider than its share.
 */
const GRID = "grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
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
}

/** How much off, from the price shown against what it was. 0 = no saving. */
function savingPercent(now: CatalogPrice | null, was: CatalogPrice | null): number {
  if (!now || !was) return 0;
  const before = Number(was.price_incl_tax);
  if (!(before > 0)) return 0;
  return Math.round((1 - Number(now.price_incl_tax) / before) * 100);
}

export function DealsFunnel({ initialProducts, categories }: DealsFunnelProps) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const money = useDisplayMoney();
  const now = useNow(true);
  const [own, setOwn] = useState<{ token: string; products: CatalogProduct[] } | null>(null);

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
  if (products.length === 0) return null;
  const publicPrices = !mine;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <section
      id="firsat-urunleri"
      aria-labelledby="deals-funnel-heading"
      className="relative scroll-mt-[var(--header-height)] py-6 sm:py-8"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0a0a0c] px-6 py-6 text-white shadow-[0_40px_90px_-45px_rgba(183,10,33,0.85)] sm:px-10 sm:py-8">
          {/* Background: two washes, a diagonal sheen, a grid masked to the
              middle, and smoke rising off the floor. */}
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

          <div className="relative text-center">
            <h2
              id="deals-funnel-heading"
              // font-semibold, like the hero and the advantages heading: the
              // original site set this in Roboto Black, which in Geist comes
              // out as a different voice from the rest of the storefront.
              className="text-[28px] font-semibold leading-[0.95] tracking-tighter text-white sm:text-[46px]"
            >
              FIRSATLARI
              {/* `bg-clip-text` paints the gradient across this element's own
                  box, so anything a glyph puts outside that box — the cedilla
                  under the Ç — gets no paint and vanishes. Its own line-height
                  plus a little padding give the tail somewhere to be. */}
              <span className="block bg-gradient-to-r from-[#fa5f6c] via-white to-[#fa5f6c] bg-clip-text pb-2 pt-0.5 leading-tight text-transparent">
                KAÇIRMA
              </span>
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-[13px] leading-relaxed text-white/70">
              nargilemalzemesi.com&apos;da her sipariş ayrıcalıklı. Fırsat ürünleri stoklarla
              sınırlıdır.
            </p>
          </div>

          <ul className={`relative mt-6 ${GRID}`}>
            {products.map((product) => {
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
                <li key={product.id} className="flex min-w-0">
                  <Link href={productHref(product.id)} className={CARD}>
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
                          alt={product.name}
                          sizes="(min-width: 1024px) 15vw, (min-width: 768px) 28vw, 44vw"
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
      </div>
    </section>
  );
}
