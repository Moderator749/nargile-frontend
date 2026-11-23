/**
 * Whether a product earns SultanPuan bought on its own, and at what rate.
 *
 * The server's rule (`LoyaltyParameters.points_for`, and the homepage's
 * SultanPuan row in `list_sultanpuan_products`): a paid retail order whose
 * subtotal is from `band_min` to `band_max` TRY, both included, earns
 * `base_rate` of it — 10% from 20.000 to 29.999,99 TL as "Parametreler" is set
 * today. A product's card price (its opening colour, at a live deal's price if
 * there is one) inside the band is a product that earns it alone. One band;
 * the yearly bonus is about a year's orders, not a product, and has no badge.
 */

/** The four figures of `StoreParameters.loyalty` this needs. */
export interface LoyaltyBand {
  enabled: boolean;
  base_rate: string;
  band_min: string;
  band_max: string;
}

/** The rate in percent (10 for "0.10") when `priceInclTax` earns it, else null. */
export function sultanPuanPercent(
  priceInclTax: string | number | null | undefined,
  loyalty: LoyaltyBand | null | undefined,
): number | null {
  if (!loyalty?.enabled || priceInclTax === null || priceInclTax === undefined || priceInclTax === "") return null;
  const price = Number(priceInclTax);
  const rate = Number(loyalty.base_rate);
  const min = Number(loyalty.band_min);
  const max = Number(loyalty.band_max);
  if (![price, rate, min, max].every(Number.isFinite) || rate <= 0) return null;
  if (price < min || price > max) return null;
  return Math.round(rate * 10000) / 100;
}
