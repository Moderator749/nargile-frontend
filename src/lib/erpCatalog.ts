/**
 * "ERP ve Katalog Fiyatları", on the product sheet under "Fiyat Tablosu": the
 * product's ERP price in USD, EUR and TL (before VAT) and, per customer group,
 * how the price catalogue (PDF) shows that group's price. How the catalogue
 * prices a group from it lives here too, so the sheet's preview and the PDF
 * cannot disagree. Pure, so `npm test` reads it.
 */

export type CatalogCurrency = "TRY" | "USD" | "EUR";
/** The catalogue's groups, in its order: the three B2B lists, then retail. */
export type CatalogSegment = "DEALER" | "WHOLESALE" | "CAFE" | "RETAIL";
export const CATALOG_SEGMENTS: readonly CatalogSegment[] = ["DEALER", "WHOLESALE", "CAFE", "RETAIL"];

/**
 * The section as the server keeps it on the product. A display choice is
 * true "KDV dahil göster", false "KDV hariç göster", null not chosen (the
 * full split: before VAT, VAT, total).
 */
export interface ErpCatalogFields {
  erp_price_usd: string | null;
  erp_price_eur: string | null;
  erp_price_tl: string | null;
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
 * The ERP price the catalogue shows for a line priced in `currency`: the one
 * in that currency, else the first typed of TL, USD, EUR. Null with none.
 */
export function erpPriceFor(
  fields: Partial<Pick<ErpCatalogFields, "erp_price_usd" | "erp_price_eur" | "erp_price_tl">>,
  currency: CatalogCurrency,
): { amount: number; currency: CatalogCurrency } | null {
  const typed: Record<CatalogCurrency, string | null | undefined> = {
    TRY: fields.erp_price_tl,
    USD: fields.erp_price_usd,
    EUR: fields.erp_price_eur,
  };
  const pick = ([currency, "TRY", "USD", "EUR"] as const).find((c) => typed[c] != null);
  return pick ? { amount: Number(typed[pick]), currency: pick } : null;
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

/**
 * The product sheet's preview, a catalogue in `currency`: each group's base is
 * the ERP price as typed (before VAT), else the group's KDV hariç price in the
 * sheet's "Fiyat Tablosu" — never an after-VAT figure — and VAT is added at the
 * product's rate only where the group shows "KDV dahil".
 */
export function productCatalogPreview({
  erp,
  display,
  currency,
  vatRate,
  priceExcl,
}: {
  erp: Partial<Pick<ErpCatalogFields, "erp_price_usd" | "erp_price_eur" | "erp_price_tl">>;
  display: Record<CatalogSegment, boolean | null>;
  currency: CatalogCurrency;
  vatRate: number;
  /** "Fiyat Tablosu", KDV hariç, in `currency`; null for an empty cell. */
  priceExcl: Record<CatalogSegment, number | null>;
}): Record<CatalogSegment, CatalogGroupPrice | null> {
  const typed = erpPriceFor(erp, currency);
  return Object.fromEntries(
    CATALOG_SEGMENTS.map((segment) => [
      segment,
      catalogPrice({
        ownPrice: priceExcl[segment],
        ownPriceBeforeVat: true,
        currency,
        vatRate,
        erp: typed,
        display: display[segment],
      }),
    ]),
  ) as Record<CatalogSegment, CatalogGroupPrice | null>;
}
