"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, Truck } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { useNow } from "@/hooks/useNow";
import { countdownParts } from "@/lib/banner";
import { categoryCopy } from "@/lib/categories";
import { cartLineFor } from "@/lib/cartLine";
import { saleState } from "@/lib/flashSale";
import { productHref } from "@/lib/seo";
import { useCartStore } from "@/store/useCartStore";
import { useCartHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

interface ProductCardProps {
  product: CatalogProduct;
  category: Category | undefined;
  isLoggedIn: boolean;
  /** Prices are server-rendered public ones (masked by CSS for logged-in viewers). */
  publicPrices: boolean;
  /** The viewer's own prices haven't loaded yet: adding now would use the wrong price. */
  pricesPending: boolean;
}

// Shared by card and skeleton so both occupy identical space (0 CLS).
// Studio light: a pure white, borderless card, so the photos' white backdrop is seamless.
const cardClass =
  "group relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 dark:ring-1 dark:ring-inset dark:ring-white/[0.06]";
// Dark mode: supplier photos (shot on white) sit on an inset light plate, not a harsh white square.
const mediaClass = "relative aspect-square overflow-hidden dark:m-2 dark:rounded-[1.25rem] dark:bg-zinc-100";
// Widest card: 3 columns in the 80rem container (catalog); 4 on the homepage is smaller.
const IMAGE_SIZES = "(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
const bodyClass = "flex flex-1 flex-col px-6 pb-6 pt-1";
// Minimal status pills: frosted glass, crimson only for a live deal.
const badgeClass =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest backdrop-blur-md";

const ADDED_FEEDBACK_MS = 1600;
const stepBtn =
  "flex h-11 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/15 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40";

/** "2g 14:03:22" / "14:03:22" — monospaced, so the badge never changes width as it ticks. */
function formatCountdown(ms: number): string {
  const { days, hours, minutes, seconds } = countdownParts(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${days > 0 ? `${days}g ` : ""}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function ProductCard({ product, category, isLoggedIn, publicPrices, pricesPending }: ProductCardProps) {
  const variant = product.variants[0];
  const regular = variant?.price ?? null;
  const listPrice = variant?.list_price ?? null;
  const soldOut = variant?.in_stock === false;
  const isHeavy = product.tags?.includes("HEAVY_CARGO") ?? false;
  const Icon = categoryCopy(category?.slug).icon;
  const money = useDisplayMoney();

  // Ticks only for cards with a sale; at expiry the regular price comes back (checkout agrees).
  const now = useNow(!!variant?.flash_sale);
  const sale = saleState(variant, now);
  const price = sale.kind === "live" ? sale.price : regular;
  // "Was" price: the viewer's regular price during a sale, else the public RETAIL price.
  const wasPrice = sale.kind === "live" ? regular : listPrice;
  const discountPct =
    price && wasPrice && Number(wasPrice.price_incl_tax) > 0
      ? Math.round((1 - Number(price.price_incl_tax) / Number(wasPrice.price_incl_tax)) * 100)
      : 0;
  const hasDiscount = discountPct > 0;
  const canAdd = !!variant && !!price && !pricesPending && !soldOut;

  // How many of this variant are already in the cart (0 until the cart has loaded).
  const cartHydrated = useCartHydrated();
  const inCart = useCartStore((s) => (variant ? (s.items.find((i) => i.variant_id === variant.id)?.quantity ?? 0) : 0));
  const inCartShown = cartHydrated ? inCart : 0;

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
      className={`${cardClass} shadow-sm shadow-black/[0.04] transition-[box-shadow,transform] duration-500 ease-out hover:shadow-xl hover:shadow-black/[0.08] motion-safe:hover:-translate-y-1 dark:shadow-none dark:hover:shadow-black/50`}
    >
      <div className={mediaClass}>
        {/* Only the photo dims when sold out; badges and the button stay crisp. */}
        <div className={`h-full transition-[filter,opacity] duration-300 ${soldOut ? "opacity-50 grayscale" : ""}`}>
          <ProductImage
            src={product.image_url}
            alt={product.name}
            sizes={IMAGE_SIZES}
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

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
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
            <span className={`${badgeClass} bg-accent/90 text-white shadow-sm shadow-accent/30`}>
              Şok
              <span className="font-mono normal-case tracking-normal tabular-nums" role="timer" aria-label="Kalan süre">
                {now === null ? "--:--:--" : formatCountdown(sale.endsAt - now)}
              </span>
            </span>
          ) : sale.kind === "ended" ? (
            <span className={`${badgeClass} bg-zinc-900/75 text-zinc-100`}>Zaman Doldu</span>
          ) : null}
        </div>

        {inCartShown > 0 && variant ? (
          // In the cart: a mini stepper replaces the "+" (− at 1 removes the item).
          <div
            role="group"
            aria-label={`${product.name}: sepette ${inCartShown} adet`}
            className="absolute bottom-3 right-3 z-10 flex h-11 items-center rounded-full bg-black/85 text-white shadow-lg backdrop-blur-md"
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
        ) : (
          // Always visible (touch has no hover); frosted ink, crimson on hover. z-10: above
          // the card-wide product link.
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            aria-label={soldOut ? `Tükendi: ${product.name}` : `Sepete ekle: ${product.name}`}
            className={`absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg backdrop-blur-md transition-[background-color,transform,opacity] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-95 ${
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
          {added ? `${product.name} sepete eklendi` : sale.kind === "ended" ? `${product.name}: kampanya süresi doldu` : ""}
        </span>
      </div>

      <div className={bodyClass}>
        <p className="h-4 truncate text-[11px] uppercase leading-4 tracking-widest text-muted-foreground">
          {product.brand ?? category?.name ?? ""}
        </p>
        <h3 className="mt-2 line-clamp-2 min-h-10 text-[15px] font-medium leading-5 tracking-tight text-foreground">
          {/* Stretched link: the whole card opens the product page; the "+" sits above it. */}
          <Link
            href={productHref(product.id)}
            className="after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
          >
            {product.name}
          </Link>
        </h3>

        {/* Fixed-height price row: switching public → segment prices never shifts layout. */}
        <div className={`mt-3 ${publicPrices ? "public-price" : ""}`}>
          <div className="flex h-6 items-baseline gap-2.5 overflow-hidden whitespace-nowrap font-mono tabular-nums">
            {price ? (
              <>
                <span className="text-base font-medium tracking-tight text-foreground">{money.format(price)}</span>
                {hasDiscount && wasPrice && (
                  <span className="text-xs text-muted-foreground line-through">{money.format(wasPrice)}</span>
                )}
                {hasDiscount && (sale.kind === "live" || !publicPrices) && (
                  <span className="text-xs font-medium text-accent">−%{discountPct}</span>
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
        <div className={`h-4 w-1/4 ${bar}`} />
        {/* 2 × 14px bars + 6px gap + 4px padding = 38px, inside the title's 40px box. */}
        <div className="mt-2 h-10 space-y-1.5 py-0.5">
          <div className={`h-3.5 w-11/12 ${bar}`} />
          <div className={`h-3.5 w-2/3 ${bar}`} />
        </div>
        <div className="mt-3">
          <div className={`h-6 w-1/3 ${bar}`} />
        </div>
      </div>
    </div>
  );
}
