/*
 * Which view a cart's summary takes: the invoice view (before VAT, the VAT,
 * the total) or the consumer view (VAT included throughout). Pure, so
 * `npm test` reads it.
 */

/**
 * The invoice view is a firm's: a Kafe, Toptan or Bayi cart (no retail
 * promotions), and since 2026-11-25 a Kurumsal account on Perakende too, which
 * gets the promotions but keeps its invoice view — each discount before VAT.
 * Never an export request (a quote), and only once the server sent the VAT.
 */
export function invoiceView(opts: {
  perksEligible: boolean;
  corporate: boolean;
  quoteOnly: boolean;
  hasVat: boolean;
}): boolean {
  if (opts.quoteOnly || !opts.hasVat) return false;
  return !opts.perksEligible || opts.corporate;
}

/** Kurumsal: any domestic account that is not Bireysel (an export account is a quote anyway). */
export const isCorporateAccount = (accountType: string | null | undefined): boolean =>
  !!accountType && accountType !== "INDIVIDUAL" && accountType !== "INTERNATIONAL";
