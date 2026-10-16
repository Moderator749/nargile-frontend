import { transferRateFor, formatRate } from "@/lib/storeParameters";
import type { CatalogPrice, ExchangeRates, StoreParameters } from "@/types";

/**
 * "₺6.839,99 Havale / EFT ile (%5 İndirim)": the price under the price, for one
 * unit paid by transfer, at the rate the live havale ladder gives that amount.
 *
 * The ladder is in TRY, so a price kept in USD/EUR is judged at the day's TCMB
 * rate — the same conversion checkout makes — and the line is left out while
 * that rate is unknown rather than guessed. The discounted figure is formatted
 * like the price above it, in the visitor's display currency.
 *
 * Only the havale discount: from ₺30.000 the ciro discount comes first in the
 * cart and the transfer rate applies to what is left, so a large order ends up
 * lower still. Checkout has the last word on the total.
 */
export function TransferPrice({
  price,
  params,
  rates,
  format,
}: {
  price: CatalogPrice;
  params: StoreParameters;
  rates: ExchangeRates | null;
  format: (price: CatalogPrice) => string;
}) {
  const amount = Number(price.price_incl_tax);
  const toTry = price.currency === "TRY" ? 1 : Number(rates?.rates[price.currency]);
  if (!(amount > 0) || !(toTry > 0)) return null;
  const rate = transferRateFor(params, amount * toTry);
  if (!(rate > 0)) return null;

  const discounted: CatalogPrice = {
    ...price,
    price_incl_tax: (amount * (1 - rate)).toFixed(2),
    price_excl_tax: (Number(price.price_excl_tax) * (1 - rate)).toFixed(2),
  };
  return (
    <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 text-base font-semibold text-emerald-600 sm:text-lg dark:text-emerald-400">
      <span className="font-mono tabular-nums">{format(discounted)}</span>
      <span className="text-sm font-medium sm:text-base">
        Havale / EFT ile ({formatRate(rate)} İndirim)
      </span>
    </p>
  );
}
