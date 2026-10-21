"use client";

import { useEffect, useState } from "react";
import { Check, Equal, Plus, ShoppingCart } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { useNow } from "@/hooks/useNow";
import { cartLineFor } from "@/lib/cartLine";
import { isExportAccount } from "@/lib/exportAccount";
import { saleState } from "@/lib/flashSale";
import { productMessages } from "@/lib/i18n/messages/product";
import { formatDisplayMoney, loadExchangeRates } from "@/lib/money";
import { displayVariant, soldOut } from "@/lib/variants";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import type { CatalogPrice, CatalogProduct, CatalogVariant, ExchangeRates } from "@/types";

/** The product the page is about, as the page has it. */
export interface BundleMain {
  product: CatalogProduct;
  /** The colour chosen on the page. */
  variant: CatalogVariant | undefined;
  /** Its price as the page shows it (a live sale's, else the viewer's own). */
  price: CatalogPrice | null;
  saleLive: boolean;
  /** Whether the page's own "Sepete Ekle" could add it right now. */
  purchasable: boolean;
}

interface BundleLine {
  product: CatalogProduct;
  variant: CatalogVariant;
  price: CatalogPrice;
  saleLive: boolean;
}

/** A price in TRY: as it is, or at the day's TCMB rate; null without a rate for it. */
function inTry(price: CatalogPrice, rates: ExchangeRates | null): number | null {
  if (price.currency === "TRY") return Number(price.price_incl_tax);
  const rate = Number(rates?.rates[price.currency]);
  return rate > 0 ? Number(price.price_incl_tax) * rate : null;
}

/**
 * Under "Birlikte İyi Gider": the product, plus the pinned products, makes the
 * whole set — "Ana Ürün ₺X + Ekstralar ₺Y = Toplam ₺Z" — and "Hepsini Sepete
 * Ekle" puts the set in the cart in one go: one of each, the product in the
 * colour chosen on the page, each extra in the colour its card shows.
 *
 * Each extra is counted at the price its card shows (a live flash sale's, else
 * the viewer's own), a sold-out or unpriced one not at all. A price kept in
 * dollars or euros is added at the day's TCMB rate, and the sums are shown in
 * the visitor's display currency, as every other price on the page. Nothing
 * while the viewer's own prices are on their way, like the cards above it.
 */
export function BundleTotal({
  main,
  extras,
  isLoggedIn,
}: {
  main: BundleMain;
  extras: CatalogProduct[];
  isLoggedIn: boolean;
}) {
  const money = useDisplayMoney();
  const t = useMessages(productMessages).bundle;
  const currency = useCurrencyStore((s) => s.currency);
  const quoteOnly = isExportAccount(useAuthStore((s) => s.user));
  const now = useNow(extras.some((p) => displayVariant(p)?.flash_sale));
  const priced = extras.flatMap<BundleLine>((product) => {
    if (soldOut(product)) return [];
    const variant = displayVariant(product);
    const sale = saleState(product, variant, now);
    const price = sale.kind === "live" ? sale.price : (variant?.price ?? null);
    return price && variant ? [{ product, variant, price, saleLive: sale.kind === "live" }] : [];
  });

  // The page loads TCMB rates only for a foreign display currency; a foreign price needs them too.
  const foreign = [main.price, ...priced.map((l) => l.price)].some((p) => p && p.currency !== "TRY");
  const [ownRates, setOwnRates] = useState<ExchangeRates | null>(null);
  useEffect(() => {
    if (!foreign || money.rates) return;
    let alive = true;
    void loadExchangeRates().then((r) => {
      if (alive) setOwnRates(r);
    });
    return () => {
      alive = false;
    };
  }, [foreign, money.rates]);
  const rates = money.rates ?? ownRates;

  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  if (!main.price || priced.length === 0) return null;
  const mainTry = inTry(main.price, rates);
  const extrasTry = priced.map((l) => inTry(l.price, rates));
  if (mainTry === null || extrasTry.some((v) => v === null)) return null;
  const extrasSum = extrasTry.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  // In TRY until the rates are in, as formatDisplayMoney falls back.
  const show = (amount: number) => formatDisplayMoney(amount, currency, rates);
  const canAdd = main.purchasable && !!main.variant;

  function addAll() {
    if (!canAdd || !main.variant || !main.price) return;
    const cart = useCartStore.getState().items;
    const set: BundleLine[] = [
      { product: main.product, variant: main.variant, price: main.price, saleLive: main.saleLive },
      ...priced,
    ];
    // One more of each — except where the buyer already has all their stock
    // allows (a request has no limit): the cart would only refuse it.
    const lines = set
      .filter(({ variant }) => {
        const limit = variant.available_quantity;
        const inCart = cart.find((i) => i.variant_id === variant.id)?.quantity ?? 0;
        return quoteOnly || limit == null || inCart < limit;
      })
      .map(({ product, variant, price, saleLive }) => cartLineFor(product, variant, price, { quantity: 1, isLoggedIn, saleLive }));
    useCartStore.getState().addItems(lines);
    setAdded(true);
  }

  return (
    <div
      role="group"
      aria-label={t.label}
      className="w-full max-w-3xl rounded-2xl border border-border bg-white px-5 py-4 shadow-sm dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-center">
        <span className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.main}</span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">{show(mainTry)}</span>
        </span>
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t.extras(priced.length)}
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">{show(extrasSum)}</span>
        </span>
        <Equal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex flex-col rounded-xl bg-red-50 px-4 py-2 dark:bg-red-500/10">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">{t.total}</span>
          <span className="font-mono text-xl font-bold tabular-nums text-red-700 dark:text-red-300">{show(mainTry + extrasSum)}</span>
        </span>
      </div>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={addAll}
          disabled={!canAdd}
          title={canAdd ? undefined : t.mainUnavailable}
          className={`inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 ${
            added ? "bg-emerald-600" : "bg-red-600 enabled:hover:bg-red-500"
          }`}
        >
          {added ? <Check className="h-4 w-4" aria-hidden /> : <ShoppingCart className="h-4 w-4" aria-hidden />}
          {added ? t.allAdded : t.addAll(priced.length + 1)}
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {added ? t.addedLive(priced.length + 1) : ""}
      </span>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {t.note}
      </p>
    </div>
  );
}
