"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Hourglass, Minus, Plus, Truck } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { useNow } from "@/hooks/useNow";
import { countdownParts } from "@/lib/banner";
import { categoryCopy } from "@/lib/categories";
import { cartLineFor } from "@/lib/cartLine";
import { isExportAccount } from "@/lib/exportAccount";
import { normalizeHex, readableInk } from "@/lib/color";
import { saleState } from "@/lib/flashSale";
import { productHref, productImageAlt } from "@/lib/seo";
import { displayVariant, hasColorChoice, soldOut as allSoldOut } from "@/lib/variants";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCartHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

interface ProductCardProps {
  product: CatalogProduct;
  /** One of the first cards in view: its photo loads eagerly (the grid's LCP). */
  eager?: boolean;
  category: Category | undefined;
  isLoggedIn: boolean;
  /** Prices are server-rendered public ones (masked by CSS for logged-in viewers). */
  publicPrices: boolean;
  /** The viewer's own prices haven't loaded yet: adding now would use the wrong price. */
  pricesPending: boolean;
}

// Shared by card and skeleton so both occupy identical space (0 CLS).
//
// The card fits itself to its own width, not the screen's (a container,
// `@container`). Below 18rem the price row takes two lines, the old price and
// the discount under the price, which no longer fit beside it there. Below
// 13rem (208px: two to a row on a phone, ≈160–190px) everything else tightens
// too — padding, type, the badges — while the same card in a desktop grid
// keeps its full size. The add button stays 44px either way: it is a thumb's
// target.
// The admin's "Birlikte Satılanlar" frame: a hairline border draws the card on
// the white page (a shadow alone let it melt into it), and a lighter rule
// under the photo parts it from the text. The photos' white backdrop still
// runs edge to edge inside the frame.
const cardClass =
  "@container group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900";
// Dark mode: supplier photos (shot on white) sit on an inset light plate, not a
// harsh white square — the plate is its own edge there, so no rule under it.
const mediaClass =
  "relative aspect-square overflow-hidden border-b border-slate-100 dark:m-2 dark:rounded-[1.25rem] dark:border-b-0 dark:bg-zinc-100";
// Widest card: 3 columns in the 80rem container (catalog); 4 on the homepage is smaller.
// What a card actually measures: four to a row beside the 16rem category
// column from xl (≈ 240px), three from lg (≈ a quarter of the screen), two
// from sm, two on a phone. The browser picks the srcset width from this.
const IMAGE_SIZES = "(min-width: 1280px) 260px, (min-width: 1024px) 25vw, 50vw";
const bodyClass = "flex flex-1 flex-col px-6 pb-6 pt-1 @max-[13rem]:px-3 @max-[13rem]:pb-3.5";
// Minimal status pills: frosted glass, crimson only for a live deal.
const badgeClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest backdrop-blur-md @max-[13rem]:gap-1 @max-[13rem]:px-2 @max-[13rem]:text-[9px] @max-[13rem]:tracking-wider";

const ADDED_FEEDBACK_MS = 1600;
const stepBtn =
  "flex h-11 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/15 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40";

/** "2g 14:03:22" / "14:03:22" — monospaced, so the badge never changes width as it ticks. */
function formatCountdown(ms: number): string {
  const { days, hours, minutes, seconds } = countdownParts(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${days > 0 ? `${days}g ` : ""}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function ProductCard({ product, category, isLoggedIn, publicPrices, pricesPending, eager }: ProductCardProps) {
  // A coloured product is still one card. The colour it speaks for is the first
  // that can be bought, so the price shown is one the visitor can actually get;
  // the card only reads "Tükendi" once every colour is gone.
  const variant = displayVariant(product);
  const needsColorChoice = hasColorChoice(product);
  const regular = variant?.price ?? null;
  const listPrice = variant?.list_price ?? null;
  // Not read off the guest's copy for a signed-in buyer: that is the Perakende
  // quota, never a B2B list's. Unknown (not sold out) until their own arrives.
  const soldOut = !pricesPending && allSoldOut(product);
  // Subscribed, not read once: the card re-renders when the account changes.
  const quoteOnly = isExportAccount(useAuthStore((s) => s.user));
  const isHeavy = product.tags?.includes("HEAVY_CARGO") ?? false;
  const Icon = categoryCopy(category?.slug).icon;
  const money = useDisplayMoney();

  // Ticks only for cards with a sale; at expiry the regular price comes back (checkout agrees).
  const now = useNow(!!variant?.flash_sale);
  const sale = saleState(product, variant, now);
  const price = sale.kind === "live" ? sale.price : regular;
  const dealColor = normalizeHex(product.opportunity_color);
  // "Was" price: the viewer's regular price during a sale, else the public RETAIL price.
  const wasPrice = sale.kind === "live" ? regular : listPrice;
  const discountPct =
    price && wasPrice && Number(wasPrice.price_incl_tax) > 0
      ? Math.round((1 - Number(price.price_incl_tax) / Number(wasPrice.price_incl_tax)) * 100)
      : 0;
  const hasDiscount = discountPct > 0;
  // Quick-add only makes sense when there is nothing to choose: picking a colour
  // for the visitor would put the wrong thing in their cart.
  // An export account is building a request, so an empty shelf does not stop
  // it adding the line; the shop answers with a quote (see `lib/exportAccount`).
  const canAdd =
    !!variant && !!price && !pricesPending && (!soldOut || quoteOnly) && !needsColorChoice;

  // How many of this variant are already in the cart (0 until the cart has loaded).
  const cartHydrated = useCartHydrated();
  const inCart = useCartStore((s) => (variant ? (s.items.find((i) => i.variant_id === variant.id)?.quantity ?? 0) : 0));
  const inCartShown = cartHydrated && !needsColorChoice ? inCart : 0;

  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function handleAdd() {
    if (!variant || !price || !canAdd) return;
    // Display snapshot only: the server re-prices the cart (sale included) at checkout.
    useCartStore
      .getState()
      .addItem(cartLineFor(product, variant, price, { quantity: 1, isLoggedIn, saleLive: sale.kind === "live" }));
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), ADDED_FEEDBACK_MS);
  }

  return (
    <article
      // Hover: the frame darkens and lifts a touch, rather than the card floating up.
      className={`${cardClass} transition-[border-color,box-shadow] duration-300 ease-out hover:border-slate-300 hover:shadow-sm dark:hover:border-white/20 dark:hover:shadow-black/40`}
    >
      <div className={mediaClass}>
        {/* Only the photo dims when sold out; badges and the button stay crisp. */}
        <div className={`h-full transition-[filter,opacity] duration-300 ${soldOut ? "opacity-50 grayscale" : ""}`}>
          <ProductImage
            src={product.image_url}
            alt={productImageAlt(product, category)}
            sizes={IMAGE_SIZES}
            eager={eager}
            fallback={
              <div className="flex h-full items-center justify-center bg-gradient-to-b from-white to-[#f5f5f7] text-zinc-300 dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-400">
                <Icon
                  className="h-12 w-12 transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
                  strokeWidth={1}
                  aria-hidden
                />
              </div>
            }
          />
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 @max-[13rem]:inset-x-2 @max-[13rem]:top-2">
          {isHeavy ? (
            <span className={`${badgeClass} bg-black/70 text-white`}>
              <Truck className="h-3 w-3" aria-hidden /> Ağır kargo
            </span>
          ) : (
            <span />
          )}
          {soldOut ? (
            <span className={`${badgeClass} bg-white/80 text-zinc-900 ring-1 ring-inset ring-black/10`}>Tükendi</span>
          ) : sale.kind === "live" ? (
            // The admin's "Fırsat rengi" is a free hex, so it goes in as an inline
            // style (Tailwind only ships classes it saw at build time), with ink
            // picked for contrast. Without a valid colour the brand accent stands.
            <span
              className={`${badgeClass} shadow-sm ${dealColor ? "" : "bg-accent/90 text-white shadow-accent/30"}`}
              style={dealColor ? { backgroundColor: dealColor, color: readableInk(dealColor) } : undefined}
            >
              {/* Label, hourglass, then the clock it is counting. An offer with no
                  deadline has nothing to count down to. On a narrow card the
                  three do not fit on one line: the coloured pill, the hourglass
                  and the clock say "deal" there, and the words go to screen
                  readers only. */}
              <span className={sale.endsAt !== null ? "@max-[13rem]:sr-only" : undefined}>Fırsat Ürün</span>
              <Hourglass className="h-3 w-3 shrink-0" aria-hidden />
              {sale.endsAt !== null && (
                <span className="font-mono normal-case tracking-normal tabular-nums" role="timer" aria-label="Kalan süre">
                  {now === null ? "--:--:--" : formatCountdown(sale.endsAt - now)}
                </span>
              )}
            </span>
          ) : sale.kind === "missed" ? (
            <span className={`${badgeClass} bg-zinc-900/75 text-zinc-100`}>
              Fırsat Kaçtı <Hourglass className="h-3 w-3 shrink-0" aria-hidden />
            </span>
          ) : null}
        </div>

        {inCartShown > 0 && variant ? (
          // In the cart: a mini stepper replaces the "+" (− at 1 removes the item).
          <div
            role="group"
            aria-label={`${product.name}: sepette ${inCartShown} adet`}
            className="absolute bottom-3 right-3 z-10 flex h-11 items-center rounded-full bg-black/85 @max-[13rem]:bottom-2 @max-[13rem]:right-2 text-white shadow-lg backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => useCartStore.getState().updateQuantity(variant.id, inCartShown - 1)}
              aria-label={inCartShown === 1 ? `${product.name}: sepetten çıkar` : `${product.name}: bir azalt`}
              className={stepBtn}
            >
              <Minus className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
            <span className="min-w-7 text-center font-mono text-sm font-semibold tabular-nums" aria-live="polite">
              {inCartShown > 999 ? "999+" : inCartShown}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              aria-label={`${product.name}: bir artır`}
              className={stepBtn}
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : needsColorChoice && !soldOut ? (
          // Nothing to add yet: which colour is the visitor's to say, so the
          // same + as every other card opens the page where the pills are
          // instead of guessing.
          <Link
            href={productHref(product)}
            aria-label={`Renk seçin: ${product.name}`}
            title="Renk seçin"
            className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white @max-[13rem]:bottom-2 @max-[13rem]:right-2 shadow-lg backdrop-blur-md transition-[background-color,transform] duration-300 ease-out hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </Link>
        ) : (
          // Always visible (touch has no hover); frosted ink, crimson on hover. z-10: above
          // the card-wide product link.
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            aria-label={soldOut ? `Tükendi: ${product.name}` : `Sepete ekle: ${product.name}`}
            className={`absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white @max-[13rem]:bottom-2 @max-[13rem]:right-2 shadow-lg backdrop-blur-md transition-[background-color,transform,opacity] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-95 ${
              added ? "bg-emerald-600" : "bg-black/80 enabled:hover:bg-accent"
            }`}
          >
            {/* Both icons share one grid cell, so the swap never shifts anything. */}
            <span className="grid [grid-template-areas:'stack']" aria-hidden>
              <Plus
                className={`h-5 w-5 transition-[opacity,transform] duration-300 [grid-area:stack] ${added ? "scale-50 opacity-0" : "scale-100 opacity-100"}`}
                strokeWidth={1.75}
              />
              <Check
                className={`h-5 w-5 transition-[opacity,transform] duration-300 [grid-area:stack] ${added ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                strokeWidth={2}
              />
            </span>
          </button>
        )}
        <span className="sr-only" aria-live="polite">
          {added ? `${product.name} sepete eklendi` : sale.kind === "missed" ? `${product.name}: fırsat kaçtı` : ""}
        </span>
      </div>

      <div className={bodyClass}>
        {/* The metadata above the name, stacked (never side by side: a long brand
            or code would crowd the other out on a phone): the brand, then the
            product code B2B buyers order by. One fixed line each, so neither
            ever shifts the card. */}
        <div className="flex flex-col gap-0.5">
          <p className="h-4 truncate text-xs uppercase leading-4 tracking-wider text-muted-foreground @max-[13rem]:text-[10px]">
            {product.brand ?? category?.name ?? ""}
            {needsColorChoice && (
              <>
                {(product.brand ?? category?.name) && " · "}
                {product.variants.length} renk
              </>
            )}
          </p>
          <p className="h-4 truncate font-mono text-xs leading-4 text-slate-500 @max-[13rem]:text-[11px] dark:text-zinc-400" title={product.base_code}>
            {product.base_code}
          </p>
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-10 text-[15px] font-semibold leading-5 tracking-tight text-foreground @max-[13rem]:mt-1.5 @max-[13rem]:min-h-9 @max-[13rem]:text-[13px] @max-[13rem]:leading-[1.125rem]">
          {/* Stretched link: the whole card opens the product page; the "+" sits above it. */}
          <Link
            href={productHref(product)}
            className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
          >
            {product.name}
          </Link>
        </h3>

        {/* Fixed-height price row: switching public → segment prices never shifts layout.
            Below 18rem it is two lines high, the old price and the discount
            under the price: "7.999,00 TL 8.500,00 TL −%6" no longer fits on
            one line of a card that narrow (a homepage row's, a phone's), and
            would lose the discount off its edge. */}
        <div className={`mt-3 @max-[13rem]:mt-2 ${publicPrices ? "public-price" : ""}`}>
          <div className="flex h-6 items-baseline gap-2.5 overflow-hidden whitespace-nowrap font-mono tabular-nums @max-[18rem]:h-10 @max-[18rem]:flex-wrap @max-[18rem]:content-start @max-[18rem]:gap-x-1.5 @max-[18rem]:gap-y-0">
            {price ? (
              <>
                <span className="text-base font-medium tracking-tight text-foreground @max-[18rem]:basis-full @max-[13rem]:text-[15px]">{money.format(price)}</span>
                {hasDiscount && wasPrice && (
                  <span className="text-xs text-muted-foreground line-through @max-[13rem]:text-[11px]">{money.format(wasPrice)}</span>
                )}
                {hasDiscount && (sale.kind === "live" || !publicPrices) && (
                  <span className="text-xs font-medium text-accent @max-[13rem]:text-[11px]">−%{discountPct}</span>
                )}
              </>
            ) : (
              <span className="font-sans text-sm text-muted-foreground">Fiyat bilgisi yok</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  const bar = "rounded bg-black/[0.06] motion-safe:animate-pulse dark:bg-white/10";
  return (
    <div className={cardClass} aria-hidden>
      <div className={`${mediaClass} bg-[#f5f5f7] motion-safe:animate-pulse dark:bg-white/5`} />
      <div className={bodyClass}>
        <div className="flex flex-col gap-0.5">
          <div className={`h-4 w-1/4 ${bar}`} />
          <div className={`h-4 w-1/5 ${bar}`} />
        </div>
        {/* 2 × 14px bars + 6px gap + 4px padding = 38px, inside the title's 40px box
            (36px on a narrow card, as its title). */}
        <div className="mt-2 h-10 space-y-1.5 py-0.5 @max-[13rem]:mt-1.5 @max-[13rem]:h-9 @max-[13rem]:space-y-1">
          <div className={`h-3.5 w-11/12 ${bar}`} />
          <div className={`h-3.5 w-2/3 ${bar}`} />
        </div>
        <div className="mt-3 @max-[13rem]:mt-2 @max-[18rem]:h-10">
          <div className={`h-6 w-1/3 ${bar} @max-[13rem]:h-5 @max-[13rem]:w-1/2`} />
        </div>
      </div>
    </div>
  );
}
