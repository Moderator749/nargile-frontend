"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import axios from "axios";
import { ArrowRight, Check, ChevronRight, Hourglass, ShoppingBag, Truck } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { ColorPicker } from "@/components/product/ColorPicker";
import { CrossSells } from "@/components/product/CrossSells";
import { ProductDescription } from "@/components/product/ProductDescription";
import { RetailPerks, TransferPerk, showsRetailPerks } from "@/components/product/RetailPerks";
import type { AdvantageSources } from "@/lib/storeAdvantages";
import { isExportAccount } from "@/lib/exportAccount";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PriceSummary } from "@/components/product/PriceSummary";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { useStoreParameters } from "@/hooks/useStoreParameters";
import { useNow } from "@/hooks/useNow";
import { checkStock, fetchProduct } from "@/lib/catalogApi";
import { cartLineFor } from "@/lib/cartLine";
import { showCartToast } from "@/lib/cartToast";
import { categoryCopy } from "@/lib/categories";
import { normalizeHex, readableInk } from "@/lib/color";
import { formatCountdown, saleState } from "@/lib/flashSale";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { productMessages } from "@/lib/i18n/messages/product";
import { brandHref, productImageAlt, type Breadcrumb } from "@/lib/seo";
import { PAGE_CONTAINER } from "@/lib/layout";
import { hasColorChoice, initialVariantId, resolveVariant, variantInStock } from "@/lib/variants";
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
  /** Kategoriler, beside the product; closed until "KATEGORİLER" opens it. */
  sidebar?: ReactNode;
  /** The homepage's advantages, as it words them, for "Size Özel Alışveriş Avantajları". */
  advantages: AdvantageSources;
}

/**
 * Product page body. Logged-in visitors refetch so the price is their own
 * segment's; until then the public price is masked (as in the catalog).
 *
 * A product's colours are its variants, each with its own stock, so the colour
 * pills are the choice of *what* is being bought: everything below them — the
 * stock badge, the cart quantity, the button — reads the selected variant.
 *
 * The buying comes first, by the gallery: title, price, colour, quantity and
 * "Sepete Ekle"; the shop's advantages ("Size Özel Alışveriş Avantajları",
 * all of them, as the homepage states them) under the button. On a phone the
 * price and the button also ride in a bar over the tab bar (`BuyBar`) while
 * the page's own button is out of sight.
 *
 * The category column sits down the left, closed on arrival (see
 * `lib/sidebar`). Below `lg` the column is the bar's drawer.
 */
export function ProductDetail({ initialProduct, category, categories, breadcrumbs, sidebar, advantages }: ProductDetailProps) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  // Null `product`: the account's own copy could not be had (see the fetch below).
  const [own, setOwn] = useState<{ token: string; product: CatalogProductDetail | null } | null>(null);
  // The stepper shows the cart's quantity until the visitor changes it (a draft).
  const [draft, setDraft] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const money = useDisplayMoney();
  const t = useMessages(productMessages);
  const card = useMessages(catalogMessages).card;
  const breadcrumbLabel = useMessages(catalogMessages).breadcrumb;
  // The advantages are a retail offer: not shown to a firm's account.
  const perksShown = showsRetailPerks(user);
  // The live rules behind the dock and the havale price line.
  const params = useStoreParameters();

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchProduct(initialProduct.id, controller.signal)
      .then((product) => setOwn({ token, product }))
      .catch((err: unknown) => {
        // Never the guest's copy instead: its price is retail, not a B2B
        // buyer's, and it is the cached page's. Prices stay masked and
        // "Sepete Ekle" off, as while it loads.
        if (!axios.isCancel(err)) setOwn({ token, product: null });
      });
    return () => controller.abort();
  }, [hydrated, token, initialProduct]);

  const loggedIn = hydrated && !!token;
  const mine = own && own.token === token ? own.product : null;
  const product = mine ?? initialProduct;
  const pricesPending = loggedIn && !mine;

  // The colour the visitor picked; null until they do, which means "the one the
  // page opened on". Kept as an id rather than an index so a refetch — the
  // logged-in price arriving — cannot silently move the selection.
  const [colorId, setColorId] = useState<string | null>(null);
  const variant = resolveVariant(product, colorId ?? initialVariantId(product));
  const now = useNow(!!variant?.flash_sale);
  const sale = saleState(product, variant, now);
  const regular = variant?.price ?? null;
  const price = sale.kind === "live" ? sale.price : regular;
  const was = sale.kind === "live" ? regular : (variant?.list_price ?? null);
  const discount =
    price && was && Number(was.price_incl_tax) > Number(price.price_incl_tax)
      ? Math.round((1 - Number(price.price_incl_tax) / Number(was.price_incl_tax)) * 100)
      : 0;
  // This colour's stock, not the product's: another colour may well be in stock.
  // The shop has one stock for every buyer; for a signed-in one it is read off
  // their own (live) copy, so it is unknown until that is in.
  const soldOut = !pricesPending && !!variant && !variantInStock(variant);
  // An export cart is a request for a quote, not a claim on the warehouse: it
  // may ask for a colour that is out of stock, and for more of it than exists.
  // The server agrees — nothing is deducted for a request (`is_quote_account`).
  const quoteOnly = isExportAccount(user);
  // Every signed-in segment but Perakende sees the price before VAT as well.
  const vatSplit = loggedIn && !pricesPending && !!user && (user.segment_code ?? "RETAIL") !== "RETAIL";
  // Its own price only: nothing until that has arrived. The split is the API's
  // own, by the product's VAT rate; with no VAT (export) there is no "+ KDV".
  const netPrice =
    vatSplit && price && Number(price.vat_rate) > 0
      ? `${money.format({ ...price, price_incl_tax: price.price_excl_tax })} ${t.plusVat}`
      : null;
  const canAdd = !!variant && !!price && !pricesPending && (!soldOut || quoteOnly);
  // The most this buyer may order of this colour, where it is known: the
  // stock count (sent to a firm's account only), or the most a stock check has
  // already taken a quantity down to. A request has none.
  const [stockMax, setStockMax] = useState<Record<string, number>>({});
  const [limitHit, setLimitHit] = useState(false);
  const learned = variant ? stockMax[variant.id] : undefined;
  const maxQuantity = quoteOnly ? null : (learned ?? (variant?.available_quantity || null));
  const capped = (q: number) => Math.max(1, maxQuantity !== null ? Math.min(q, maxQuantity) : q);
  /**
   * A quantity held to the stock without the count being shown: asked about
   * (`checkStock`) and taken down to the most there is — "Stok sınırına
   * ulaştınız". Resolves to the quantity to use.
   */
  const asked = useRef(0);
  async function holdToStock(q: number): Promise<number> {
    if (!variant || quoteOnly || maxQuantity !== null) return q;
    const ask = ++asked.current;
    try {
      const [line] = await checkStock([{ variant_id: variant.id, quantity: q }]);
      if (ask !== asked.current || !line?.capped || line.quantity < 1) return q;
      setStockMax((m) => ({ ...m, [variant.id]: line.quantity }));
      setDraft(line.quantity);
      setLimitHit(true);
      return line.quantity;
    } catch {
      return q; // checkout holds the order to the stock anyway
    }
  }

  const cartHydrated = useCartHydrated();
  const inCartRaw = useCartStore((s) => (variant ? (s.items.find((i) => i.variant_id === variant.id)?.quantity ?? 0) : 0));
  const inCart = cartHydrated ? inCartRaw : 0;
  const quantity = draft ?? (inCart > 0 ? inCart : 1);
  const changed = inCart > 0 && quantity !== inCart;
  // What the buy button is for now, here and in the phone's buy bar.
  const buy: BuyState =
    inCart > 0
      ? changed
        ? { kind: "update", disabled: quantity > inCart && !canAdd }
        : { kind: "goToCart", justAdded: added }
      : { kind: "add", disabled: !canAdd, soldOut };

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  /** Not in the cart: add `quantity`. In the cart: set it to exactly `quantity`. Either way held to the stock. */
  async function commit() {
    if (!variant || !price) return;
    if (inCart === 0 && !canAdd) return;
    const held = quantity > inCart ? await holdToStock(quantity) : quantity;
    const cart = useCartStore.getState();
    if (inCart > 0) {
      cart.updateQuantity(variant.id, held);
    } else {
      cart.addItem(
        cartLineFor(product, variant, price, { quantity: held, isLoggedIn: loggedIn, saleLive: sale.kind === "live" }),
      );
    }
    setDraft(null);
    setAdded(true);
    showCartToast(inCart > 0 ? { kind: "updated" } : { kind: "added", name: product.name, image: product.image_url });
  }

  // The page's own button in sight or not: the phone's buy bar shows while it is not.
  const buyRow = useRef<HTMLDivElement>(null);
  const [buyInView, setBuyInView] = useState(true);
  useEffect(() => {
    const row = buyRow.current;
    if (!row) return;
    // In sight means clear of the phone's tab bar (64px and the home indicator), not just under it.
    const observer = new IntersectionObserver(([entry]) => setBuyInView(entry.isIntersecting), {
      rootMargin: "0px 0px -88px 0px",
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const Icon = categoryCopy(category?.slug).icon;
  const isHeavy = product.tags?.includes("HEAVY_CARGO") ?? false;
  const dealColor = normalizeHex(product.opportunity_color);

  return (
    <div className={`${PAGE_CONTAINER} py-8 sm:py-12 lg:flex lg:items-start`}>
      {sidebar}

      <div className="min-w-0 flex-1">
      <nav aria-label={breadcrumbLabel}>
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.slice(0, -1).map((c) => (
            <li key={c.href} className="flex items-center gap-1">
              <Link href={c.href} className="hover:text-foreground">
                {c.name}
              </Link>
              <ChevronRight className="h-3 w-3 rtl:rotate-180" aria-hidden />
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
          alt={productImageAlt(product, category)}
          dimmed={soldOut}
          fallback={
            <div className="flex h-full items-center justify-center text-zinc-300">
              <Icon className="h-20 w-20" strokeWidth={1} aria-hidden />
            </div>
          }
        />

        <div className="flex min-w-0 flex-col">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            {/* The brand, a link to its page (every product it makes). */}
            {product.brand && product.brand_slug ? (
              <Link href={brandHref(product.brand_slug)} className="hover:text-foreground hover:underline">
                {product.brand}
              </Link>
            ) : (
              (product.brand ?? category?.name ?? "Nargile Malzemesi")
            )}
          </p>
          <h1 className="mt-3 text-balance text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-[26px]">
            {product.name}
          </h1>
          {variant && <p className="mt-2 font-mono text-xs text-muted-foreground">{t.productCode(variant.sku)}</p>}
          {/* A business account's price before VAT sits in the price table,
              beside the gross price (`net`); the price it is reduced from, and
              by how much, move up here under the code. Without a "+ KDV" line
              (export: no VAT) the table keeps them, as for everyone else. */}
          {netPrice && discount > 0 && was && (
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2.5 font-mono text-sm tabular-nums">
              <span className="text-muted-foreground line-through">{money.format(was)}</span>
              <span className="text-xs font-bold text-accent">{card.discount(discount)}</span>
            </p>
          )}

          <div className={`mt-6 ${pricesPending ? "public-price" : ""}`}>
            {price ? (
              // One row per way of paying; the havale row and the installments
              // are retail promotions, not promised to an account on its own list.
              <PriceSummary
                price={price}
                was={was}
                discount={discount}
                retail={perksShown}
                installments={advantages.sections.perks ? advantages.perks.installments.value || null : null}
                params={params}
                rates={money.rates}
                format={money.format}
                net={netPrice}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{card.noPrice}</p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">{t.vatIncluded}</p>
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
                {card.deal} <Hourglass className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {sale.endsAt !== null && (
                  <span className="font-mono tabular-nums" role="timer" aria-label={card.timeLeft}>
                    {now === null ? "--:--:--" : formatCountdown(sale.endsAt - now, card.days)}
                  </span>
                )}
              </span>
            )}
            {sale.kind === "missed" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-100 dark:bg-zinc-700">
                {card.missed} <Hourglass className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </span>
            )}
            {pricesPending ? null : soldOut ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/10">
                {card.soldOut}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                {t.inStock}
              </span>
            )}
            {isHeavy && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                <Truck className="h-3 w-3" aria-hidden /> {card.heavy}
              </span>
            )}
          </div>

          {/* One pill per colour, each its own stock. A single-colour product has
              nothing to choose, so it gets no picker. */}
          {hasColorChoice(product) && variant && (
            <ColorPicker
              variants={product.variants}
              stockPending={pricesPending}
              selectedId={variant.id}
              onSelect={(id) => {
                setColorId(id);
                // Each colour is its own cart line, so the stepper goes back to
                // reading the new colour's quantity rather than keeping a draft
                // that was typed for the previous one.
                setDraft(null);
                setAdded(false);
                setLimitHit(false);
              }}
            />
          )}

          <div ref={buyRow} className="mt-8 flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={quantity}
              onChange={(q) => {
                setDraft(capped(q));
                setLimitHit(false);
                if (q > quantity) void holdToStock(q);
              }}
              label={product.name}
              max={maxQuantity}
              limitReached={limitHit && quantity === maxQuantity}
            />
            <BuyButton state={buy} onCommit={commit} className="flex-1 sm:flex-none sm:min-w-56" />
          </div>
          <p className="mt-2 flex min-h-11 flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground" aria-live="polite">
            {inCart > 0 && (
              <>
                {t.inYourCart(inCart)} ·
                <button
                  type="button"
                  onClick={() => {
                    if (variant) useCartStore.getState().removeItem(variant.id);
                    setDraft(null);
                  }}
                  className="inline-flex min-h-11 items-center px-1 font-medium text-foreground underline-offset-2 hover:underline"
                >
                  {t.removeFromCart}
                </button>
              </>
            )}
          </p>

          {/* The shop's advantages, every one of them, under the button rather
              than between the price and it; a firm's account sees only the
              havale discount, and only where this product gives its list one. */}
          {perksShown ? (
            <div className="mt-6 border-t border-border pt-6">
              <RetailPerks params={params} sources={advantages} />
            </div>
          ) : (
            product.segment_havale && (
              <div className="mt-6 border-t border-border pt-6">
                <TransferPerk params={params} sources={advantages} />
              </div>
            )
          )}

          {/* A three-line preview rather than a wall of text, so "Sepete Ekle"
              stays the first thing below the price. */}
          {product.description && <ProductDescription html={product.description} />}
        </div>
      </div>

      {/* Below the product itself, across both columns. */}
      <CrossSells
        products={product.cross_sells}
        categories={categories}
        isLoggedIn={loggedIn}
        pricesPending={pricesPending}
        main={{ product, variant, price, saleLive: sale.kind === "live", purchasable: canAdd }}
      />
      </div>

      {/* A phone's buy bar while the page's own button is out of sight, and the
          room it takes kept free at the page's foot. */}
      <BuyBar
        shown={!buyInView && !!variant}
        label={t.buyBar}
        price={price && !pricesPending ? money.format(price) : null}
        was={discount > 0 && was && !pricesPending ? money.format(was) : null}
        state={buy}
        onCommit={commit}
      />
      <div aria-hidden className="h-20 md:hidden" />
    </div>
  );
}

type BuyState =
  | { kind: "add"; disabled: boolean; soldOut: boolean }
  | { kind: "update"; disabled: boolean }
  | { kind: "goToCart"; justAdded: boolean };

const BUY_BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold transition-[background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:active:scale-[0.98]";

/**
 * "Sepete Ekle", "Sepeti Güncelle", or — once the colour is in the cart as
 * asked — "Sepete Git →", a way on rather than a faded, spent button. Just
 * after adding it says so for a moment, on green, at full strength.
 */
function BuyButton({ state, onCommit, className = "" }: { state: BuyState; onCommit: () => void; className?: string }) {
  const t = useMessages(productMessages);
  const card = useMessages(catalogMessages).card;
  if (state.kind === "goToCart") {
    return (
      <Link
        href="/cart"
        className={`${BUY_BUTTON} ${className} ${
          state.justAdded ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        }`}
      >
        {state.justAdded ? (
          <>
            <Check className="h-4 w-4" aria-hidden /> {t.addedToCart}
          </>
        ) : (
          <>
            {t.goToCartButton} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          </>
        )}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onCommit}
      // Lowering or keeping a cart quantity is always allowed; adding needs stock and prices.
      disabled={state.disabled}
      className={`${BUY_BUTTON} ${className} bg-accent text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400`}
    >
      <ShoppingBag className="h-4 w-4" aria-hidden />
      {state.kind === "update" ? t.updateCart : state.soldOut ? card.soldOut : t.addToCart}
    </button>
  );
}

/**
 * The phone's buy bar: the price and the button, over the tab bar, while the
 * page's own "Sepete Ekle" is scrolled out of sight. It tells the cart's notice
 * (CartToast) how tall it is, so the notice rises above it.
 */
function BuyBar({
  shown,
  label,
  price,
  was,
  state,
  onCommit,
}: {
  shown: boolean;
  label: string;
  price: string | null;
  was: string | null;
  state: BuyState;
  onCommit: () => void;
}) {
  useEffect(() => {
    if (!shown || !window.matchMedia("(max-width: 47.99rem)").matches) return;
    const root = document.documentElement;
    root.style.setProperty("--buy-bar-height", "4.5rem");
    return () => {
      root.style.removeProperty("--buy-bar-height");
    };
  }, [shown]);

  return (
    <div
      role="region"
      aria-label={label}
      aria-hidden={!shown}
      inert={!shown}
      className={`fixed inset-x-0 bottom-[calc(4rem+1px+env(safe-area-inset-bottom,0px))] z-40 border-t border-border bg-white/95 px-4 py-2.5 shadow-[0_-8px_16px_-12px_rgb(0_0_0/0.35)] backdrop-blur-md transition-[transform,opacity] duration-200 md:hidden dark:bg-background/95 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 leading-tight">
          {price && <p className="truncate text-lg font-semibold tabular-nums text-foreground">{price}</p>}
          {was && <p className="truncate text-xs tabular-nums text-muted-foreground line-through">{was}</p>}
        </div>
        <BuyButton state={state} onCommit={onCommit} className="shrink-0 px-6" />
      </div>
    </div>
  );
}
