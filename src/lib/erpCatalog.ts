/**
 * "ERP ve Katalog Fiyatları", on the product sheet under "Fiyat Tablosu": the
 * product's ERP price per currency and customer group (before VAT) and, per
 * group, how the price catalogue (PDF) shows that group's price. How each
 * catalogue — the admin's from a pricing file, the storefront's /fiyat-katalogu
 * — prices a group from it lives here too, so they cannot disagree. Pure, so
 * `npm test` reads it.
 */

export type CatalogCurrency = "TRY" | "USD" | "EUR";
/** The catalogue's groups, in its order: the three B2B lists, then retail. */
export type CatalogSegment = "DEALER" | "WHOLESALE" | "CAFE" | "RETAIL";
export const CATALOG_SEGMENTS: readonly CatalogSegment[] = ["DEALER", "WHOLESALE", "CAFE", "RETAIL"];

/** Prices per currency and group, as decimal strings; an empty cell is absent. */
export type PriceMatrix = Partial<Record<CatalogCurrency, Partial<Record<CatalogSegment, string>>>>;

/**
 * The section as the server keeps it on the product: `erp_prices` before VAT
 * (a pricing worksheet's "ERP fiyatı" row is written there when it is
 * applied). A display choice is true "KDV dahil göster", false "KDV hariç
 * göster", null not chosen (the full split: before VAT, VAT, total).
 */
export interface ErpCatalogFields {
  erp_prices: PriceMatrix;
  erp_display_bayi: boolean | null;
  erp_display_toptan: boolean | null;
  erp_display_kafe: boolean | null;
  erp_display_perakende: boolean | null;
}

export type ErpDisplayField = "erp_display_bayi" | "erp_display_toptan" | "erp_display_kafe" | "erp_display_perakende";

/** Each group's display choice. */
export const ERP_DISPLAY_FIELDS: Record<CatalogSegment, ErpDisplayField> = {
  DEALER: "erp_display_bayi",
  WHOLESALE: "erp_display_toptan",
  CAFE: "erp_display_kafe",
  RETAIL: "erp_display_perakende",
};

/**
 * A group's ERP price for a catalogue priced in `currency`: the group's in
 * that currency, else its first of TL, USD, EUR. Null with none.
 */
export function erpPriceFor(
  prices: PriceMatrix | null | undefined,
  currency: CatalogCurrency,
  segment: CatalogSegment,
): { amount: number; currency: CatalogCurrency } | null {
  const pick = ([currency, "TRY", "USD", "EUR"] as const).find((c) => prices?.[c]?.[segment] != null);
  return pick ? { amount: Number(prices![pick]![segment]), currency: pick } : null;
}

/** A price split for an invoice, the VAT the difference so the three add up to the kuruş. */
export function splitVat(amount: number, vatRate: number, amountIsBeforeVat: boolean) {
  const round = (n: number) => Math.round(n * 100) / 100;
  const excl = amountIsBeforeVat ? amount : round(amount / (1 + vatRate / 100));
  const total = amountIsBeforeVat ? round(amount * (1 + vatRate / 100)) : amount;
  return { excl, vat: round(total - excl), total };
}

/** One group's price as the price catalogue (PDF) shows it. */
export interface CatalogGroupPrice {
  currency: CatalogCurrency;
  /** The base: before VAT, whatever the price came as. */
  excl: number;
  vat: number;
  total: number;
  /** As chosen: true only after VAT, false only before it, null the full split. */
  display: boolean | null;
  /** The ERP price, not the group's own. */
  fromErp: boolean;
}

/**
 * What the price catalogue shows for one group: the ERP price (before VAT)
 * when one is typed, else the group's own price in its own basis, split at
 * `vatRate` and shown as the group's choice says. Null with no price: the
 * group is left off the plate.
 */
export function catalogPrice({
  ownPrice,
  ownPriceBeforeVat,
  currency,
  vatRate,
  erp,
  display,
}: {
  ownPrice: number | null;
  ownPriceBeforeVat: boolean;
  currency: CatalogCurrency;
  vatRate: number;
  erp: { amount: number; currency: CatalogCurrency } | null;
  display: boolean | null;
}): CatalogGroupPrice | null {
  if (erp) return { currency: erp.currency, display, fromErp: true, ...splitVat(erp.amount, vatRate, true) };
  if (ownPrice === null) return null;
  return { currency, display, fromErp: false, ...splitVat(ownPrice, vatRate, ownPriceBeforeVat) };
}

/** A product's section and price table, as the pricing records list carries it. */
export interface ProductErpCatalog extends ErpCatalogFields {
  /** The rate of its price table; null when it has no price. */
  vat_rate: string | null;
  /** "Fiyat Tablosu", KDV hariç: [currency][group]; a cell left empty is absent. */
  prices_excl: PriceMatrix;
}

/**
 * A worksheet row's group in the price catalogue (PDF). The base, before VAT,
 * is the first there is of:
 *   1. the product's ERP price for the group (`erp_prices`);
 *   2. the row's own "ERP fiyatı" for it (the blue row; a row not applied yet);
 *   3. the product's KDV hariç price in "Fiyat Tablosu", in the row's currency;
 *   4. the row's own "uygulanacak" price (the green row), for a code that
 *      names no product or a group the product has no price for.
 * The green row is the site's price, marked up from the ERP base: it is never
 * the base while an ERP price exists. VAT is at the product's rate (the row's
 * without a product), added as the product chose for the group.
 */
export function rowCatalogPrice({
  product,
  segment,
  currency,
  rowErp,
  rowErpBeforeVat,
  rowPrice,
  rowPriceBeforeVat,
  rowVatRate,
}: {
  product: ProductErpCatalog | null;
  segment: CatalogSegment;
  currency: CatalogCurrency;
  /** The row's "ERP fiyatı" for the group, in its own basis; null when not typed. */
  rowErp: number | null;
  rowErpBeforeVat: boolean;
  rowPrice: number | null;
  rowPriceBeforeVat: boolean;
  rowVatRate: number;
}): CatalogGroupPrice | null {
  const display = product?.[ERP_DISPLAY_FIELDS[segment]] ?? null;
  const vatRate = product?.vat_rate != null ? Number(product.vat_rate) : rowVatRate;
  const erp =
    erpPriceFor(product?.erp_prices, currency, segment) ??
    (rowErp === null ? null : { amount: splitVat(rowErp, rowVatRate, rowErpBeforeVat).excl, currency });
  const tableExcl = product?.prices_excl?.[currency]?.[segment];
  if (erp || tableExcl != null) {
    return catalogPrice({
      ownPrice: tableExcl == null ? null : Number(tableExcl),
      ownPriceBeforeVat: true,
      currency,
      vatRate,
      erp,
      display,
    });
  }
  return catalogPrice({ ownPrice: rowPrice, ownPriceBeforeVat: rowPriceBeforeVat, currency, vatRate: rowVatRate, erp: null, display });
}

/** A group's price as the storefront's price catalogue receives it (`/products/price-list`). */
export interface ListedGroupPrice {
  currency: CatalogCurrency;
  price_excl_tax: string;
  price_incl_tax: string;
  vat_rate: string;
  /** The group's ERP price, before VAT; null without one. */
  erp_price?: string | null;
  erp_currency?: CatalogCurrency | null;
  /** True "KDV dahil göster", false "KDV hariç göster", null not chosen. */
  vat_display?: boolean | null;
}

/**
 * A group in the storefront's price catalogue (`/fiyat-katalogu` and its
 * "PDF İndir"): the group's ERP price as the base, VAT added at the price's
 * own rate, else the list price exactly as stored (its two sides, so a shelf
 * price never drifts by a kuruş). `display` is the product's choice for the
 * group, null when it made none.
 */
export function listCatalogPrice(p: ListedGroupPrice): CatalogGroupPrice {
  const display = p.vat_display ?? null;
  if (p.erp_price != null) {
    return catalogPrice({
      ownPrice: null,
      ownPriceBeforeVat: true,
      currency: p.currency,
      vatRate: Number(p.vat_rate),
      erp: { amount: Number(p.erp_price), currency: p.erp_currency ?? p.currency },
      display,
    })!;
  }
  const excl = Number(p.price_excl_tax);
  const total = Number(p.price_incl_tax);
  return { currency: p.currency, excl, vat: Math.round((total - excl) * 100) / 100, total, display, fromErp: false };
}
