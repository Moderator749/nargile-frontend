import { transferRateFor } from "@/lib/storeParameters";
import type { CatalogPrice, ExchangeRates, StoreParameters } from "@/types";

/**
 * One unit paid by transfer: the price less the rate the live havale ladder
 * gives that amount, and the rate. Null where there is no discount, or while
 * a USD/EUR price's TCMB rate is unknown (rather than guessed).
 *
 * The ladder is in TRY, so a price kept in USD/EUR is judged at the day's
 * TCMB rate — the same conversion checkout makes. Only the havale discount:
 * from ₺30.000 the ciro discount comes first in the cart and the transfer
 * rate applies to what is left, so a large order ends up lower still.
 * Checkout has the last word on the total.
 */
export function transferPriceFor(
  price: CatalogPrice,
  params: StoreParameters,
  rates: ExchangeRates | null,
): { price: CatalogPrice; rate: number } | null {
  const amount = Number(price.price_incl_tax);
  const toTry = price.currency === "TRY" ? 1 : Number(rates?.rates[price.currency]);
  if (!(amount > 0) || !(toTry > 0)) return null;
  const rate = transferRateFor(params, amount * toTry);
  if (!(rate > 0)) return null;
  return {
    rate,
    price: {
      ...price,
      price_incl_tax: (amount * (1 - rate)).toFixed(2),
      price_excl_tax: (Number(price.price_excl_tax) * (1 - rate)).toFixed(2),
    },
  };
}
