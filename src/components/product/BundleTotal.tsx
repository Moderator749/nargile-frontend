"use client";

import { useEffect, useState } from "react";
import { Equal, Plus } from "lucide-react";

import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { useNow } from "@/hooks/useNow";
import { saleState } from "@/lib/flashSale";
import { formatDisplayMoney, loadExchangeRates } from "@/lib/money";
import { displayVariant, soldOut } from "@/lib/variants";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import type { CatalogPrice, CatalogProduct, ExchangeRates } from "@/types";

/** A price in TRY: as it is, or at the day's TCMB rate; null without a rate for it. */
function inTry(price: CatalogPrice, rates: ExchangeRates | null): number | null {
  if (price.currency === "TRY") return Number(price.price_incl_tax);
  const rate = Number(rates?.rates[price.currency]);
  return rate > 0 ? Number(price.price_incl_tax) * rate : null;
}

/**
 * Under "Birlikte İyi Gider": the product, plus the pinned products, makes the
 * whole set — "Ana Ürün ₺X + Ekstralar ₺Y = Toplam ₺Z".
 *
 * Each extra is counted at the price its card shows (a live flash sale's, else
 * the viewer's own), a sold-out or unpriced one not at all. A price kept in
 * dollars or euros is added at the day's TCMB rate, and the sums are shown in
 * the visitor's display currency, as every other price on the page. Nothing
 * while the viewer's own prices are on their way, like the cards above it.
 */
export function BundleTotal({ main, extras }: { main: CatalogPrice | null; extras: CatalogProduct[] }) {
  const money = useDisplayMoney();
  const currency = useCurrencyStore((s) => s.currency);
  const now = useNow(extras.some((p) => displayVariant(p)?.flash_sale));
  const priced = extras.flatMap((product) => {
    if (soldOut(product)) return [];
    const variant = displayVariant(product);
    const sale = saleState(product, variant, now);
    const price = sale.kind === "live" ? sale.price : (variant?.price ?? null);
    return price ? [price] : [];
  });

  // The page loads TCMB rates only for a foreign display currency; a foreign price needs them too.
  const foreign = [main, ...priced].some((p) => p && p.currency !== "TRY");
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

  if (!main || priced.length === 0) return null;
  const mainTry = inTry(main, rates);
  const extrasTry = priced.map((p) => inTry(p, rates));
  if (mainTry === null || extrasTry.some((v) => v === null)) return null;
  const extrasSum = extrasTry.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  // In TRY until the rates are in, as formatDisplayMoney falls back.
  const show = (amount: number) => formatDisplayMoney(amount, currency, rates);

  return (
    <div
      role="group"
      aria-label="Birlikte alındığında toplam"
      className="w-full max-w-3xl rounded-2xl border border-border bg-white px-5 py-4 shadow-sm dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-center">
        <span className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ana Ürün</span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">{show(mainTry)}</span>
        </span>
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ekstralar ({priced.length} ürün)
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">{show(extrasSum)}</span>
        </span>
        <Equal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex flex-col rounded-xl bg-red-50 px-4 py-2 dark:bg-red-500/10">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">Toplam</span>
          <span className="font-mono text-xl font-bold tabular-nums text-red-700 dark:text-red-300">{show(mainTry + extrasSum)}</span>
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Hepsi birlikte, KDV dahil. Kargo ve indirimler sepette hesaplanır.
      </p>
    </div>
  );
}
