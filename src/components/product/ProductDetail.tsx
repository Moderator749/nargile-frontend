"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Check, ChevronRight, Hourglass, ShoppingBag, Truck } from "lucide-react";

import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { CrossSells } from "@/components/product/CrossSells";
import { ProductGallery } from "@/components/product/ProductGallery";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { useNow } from "@/hooks/useNow";
import { countdownParts } from "@/lib/banner";
import { fetchProduct } from "@/lib/catalogApi";
import { cartLineFor } from "@/lib/cartLine";
import { categoryCopy } from "@/lib/categories";
import { normalizeHex, readableInk } from "@/lib/color";
import { saleState } from "@/lib/flashSale";
import type { Breadcrumb } from "@/lib/seo";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useAuthHydrated, useCartHydrated } from "@/store/useHasHydrated";
import type { CatalogProductDetail, Category } from "@/types";

interface ProductDetailProps {
  /** Server-rendered anonymous (RETAIL) view. */
  initialProduct: CatalogProductDetail;
  category: Category | undefined;
  /** Every category, so a cross-sell card can label and illustrate its own. */
  categories: Category[];
  breadcrumbs: Breadcrumb[];
}

function countdown(ms: number) {
  const { days, hours, minutes, seconds } = countdownParts(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${days > 0 ? `${days}g ` : ""}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Product page body. Logged-in visitors refetch so the price is their own
 * segment's; until then the public price is masked (as in the catalog).
 */
export function ProductDetail({ initialProduct, category, categories, breadcrumbs }: ProductDetailProps) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [own, setOwn] = useState<{ token: string; product: CatalogProductDetail } | null>(null);
  // The stepper shows the cart's quantity until the visitor changes it (a draft).
  const [draft, setDraft] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const money = useDisplayMoney();

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchProduct(initialProduct.id, controller.signal)
      .then((product) => setOwn({ token, product }))
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setOwn({ token, product: initialProduct });
      });
    return () => controller.abort();
  }, [hydrated, token, initialProduct]);

  const loggedIn = hydrated && !!token;
  const mine = own && own.token === token ? own.product : null;
  const product = mine ?? initialProduct;
  const pricesPending = loggedIn && !mine;

  const variant = product.variants[0];
  const now = useNow(!!variant?.flash_sale);
  const sale = saleState(product, variant, now);
  const regular = variant?.price ?? null;
  const price = sale.kind === "live" ? sale.price : regular;
  const was = sale.kind === "live" ? regular : (variant?.list_price ?? null);
  const discount =
    price && was && Number(was.price_incl_tax) > Number(price.price_incl_tax)
      ? Math.round((1 - Number(price.price_incl_tax) / Number(was.price_incl_tax)) * 100)
      : 0;
  const soldOut = variant?.in_stock === false;
  const canAdd = !!variant && !!price && !pricesPending && !soldOut;

  const cartHydrated = useCartHydrated();
  const inCartRaw = useCartStore((s) => (variant ? (s.items.find((i) => i.variant_id === variant.id)?.quantity ?? 0) : 0));
  const inCart = cartHydrated ? inCartRaw : 0;
  const quantity = draft ?? (inCart > 0 ? inCart : 1);
  const changed = inCart > 0 && quantity !== inCart;

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  /** Not in the cart: add `quantity`. In the cart: set it to exactly `quantity`. */
  function commit() {
    if (!variant || !price) return;
    const cart = useCartStore.getState();
    if (inCart > 0) {
      cart.updateQuantity(variant.id, quantity);
    } else {
      if (!canAdd) return;
      cart.addItem(cartLineFor(product, variant, price, { quantity, isLoggedIn: loggedIn, saleLive: sale.kind === "live" }));
    }
    setDraft(null);
    setAdded(true);
  }

  const Icon = categoryCopy(category?.slug).icon;
  const isHeavy = product.tags?.includes("HEAVY_CARGO") ?? false;
  const dealColor = normalizeHex(product.opportunity_color);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <nav aria-label="Sayfa konumu">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.slice(0, -1).map((c) => (
            <li key={c.href} className="flex items-center gap-1">
              <Link href={c.href} className="hover:text-foreground">
                {c.name}
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
            </li>
          ))}
          <li aria-current="page" className="max-w-64 truncate text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.image_urls}
          youtubeUrl={product.youtube_video_url}
          alt={product.name}
          dimmed={soldOut}
          fallback={
            <div className="flex h-full items-center justify-center text-zinc-300">
              <Icon className="h-20 w-20" strokeWidth={1} aria-hidden />
            </div>
          }
        />

        <div className="flex flex-col">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            {product.brand ?? category?.name ?? "Nargile Malzemesi"}
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
            {product.name}
          </h1>
          {variant && <p className="mt-2 font-mono text-xs text-muted-foreground">Ürün kodu: {variant.sku}</p>}

          <div className={`mt-6 ${pricesPending ? "public-price" : ""}`}>
            {price ? (
              <div className="flex flex-wrap items-baseline gap-3 font-mono tabular-nums">
                <span className="text-3xl font-medium tracking-tight text-foreground">{money.format(price)}</span>
                {discount > 0 && was && (
                  <>
                    <span className="text-base text-muted-foreground line-through">{money.format(was)}</span>
                    <span className="text-sm font-medium text-accent">−%{discount}</span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Fiyat bilgisi yok</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">KDV dahil</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {sale.kind === "live" && (
              // Same badge as the card: the admin's hex as an inline style, with
              // ink chosen for contrast.
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  dealColor ? "" : "bg-accent text-white"
                }`}
                style={dealColor ? { backgroundColor: dealColor, color: readableInk(dealColor) } : undefined}
              >
                Fırsat Ürün <Hourglass className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {sale.endsAt !== null && (
                  <span className="font-mono tabular-nums" role="timer" aria-label="Kalan süre">
                    {now === null ? "--:--:--" : countdown(sale.endsAt - now)}
                  </span>
                )}
              </span>
            )}
            {sale.kind === "missed" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-100 dark:bg-zinc-700">
                Fırsat Kaçtı <Hourglass className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </span>
            )}
            {soldOut ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/10">
                Tükendi
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Stokta
              </span>
            )}
            {isHeavy && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                <Truck className="h-3 w-3" aria-hidden /> Ağır kargo
              </span>
            )}
          </div>

          {/* "Renk": labels the admin typed, not a variant axis — one product, one
              price, these colours. Absent in an older cached payload. */}
          {(product.color_names?.length ?? 0) > 0 && (
            <div className="mt-4">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Renk</h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {product.color_names?.map((color) => (
                  <li
                    key={color}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-inset ring-border"
                  >
                    {color}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} onChange={(q) => setDraft(Math.max(1, q))} label={product.name} />
            <button
              type="button"
              onClick={commit}
              // Lowering or keeping a cart quantity is always allowed; adding needs stock and prices.
              disabled={inCart > 0 ? !changed || (quantity > inCart && !canAdd) : !canAdd}
              className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-7 text-sm font-medium text-white transition-[background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.98] sm:flex-none ${
                added ? "bg-emerald-600" : "bg-accent hover:bg-accent-hover"
              }`}
            >
              {added || (inCart > 0 && !changed) ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <ShoppingBag className="h-4 w-4" aria-hidden />
              )}
              {inCart > 0
                ? changed
                  ? "Sepeti Güncelle"
                  : added
                    ? "Sepet güncellendi"
                    : "Sepette"
                : soldOut
                  ? "Tükendi"
                  : added
                    ? "Sepete eklendi"
                    : "Sepete Ekle"}
            </button>
          </div>
          <p className="mt-3 h-5 text-sm text-muted-foreground" aria-live="polite">
            {inCart > 0 && (
              <>
                Sepetinizde {inCart} adet ·{" "}
                <Link href="/cart" className="font-medium text-foreground underline-offset-2 hover:underline">
                  Sepete git
                </Link>{" "}
                ·{" "}
                <button
                  type="button"
                  onClick={() => {
                    if (variant) useCartStore.getState().removeItem(variant.id);
                    setDraft(null);
                  }}
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Sepetten çıkar
                </button>
              </>
            )}
          </p>

          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-sm font-semibold text-foreground">Ürün açıklaması</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{product.description}</p>
            </div>
          )}

          <ul className="mt-8 space-y-1.5 border-t border-border pt-6 text-xs text-muted-foreground">
            <li>₺3.000 üzeri kargo ücretsiz (kömür ağırlıklı siparişlerde en az 20 kg).</li>
            <li>İstanbul içi aynı gün kurye, 10:00 – 20:00.</li>
            <li>Havale/EFT ile %5 – %7 indirim.</li>
          </ul>
        </div>
      </div>

      {/* Below the product itself, across both columns. */}
      <CrossSells
        products={product.cross_sells}
        categories={categories}
        isLoggedIn={loggedIn}
        pricesPending={pricesPending}
      />
    </div>
  );
}
