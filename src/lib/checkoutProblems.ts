/**
 * What still stands between a buyer and "Siparişi Tamamla", one entry per
 * field, in the order the page shows them.
 *
 * The pay button stays tappable whatever is missing: a tap that cannot go
 * through scrolls to the first entry, focuses its field and turns every listed
 * field red, and the list itself sits beside the button. This module only
 * knows the fields' names and where they are on the page; the messages come
 * from the checks that found them (addressDraft, invoiceDraft, the cart).
 */

export type ProblemField =
  | "quote"
  | "stock"
  | "invoiceTitle"
  | "invoiceLine"
  | "invoiceCity"
  | "invoiceDistrict"
  | "taxOffice"
  | "taxNumber"
  | "branch"
  | "name"
  | "phone"
  | "country"
  | "city"
  | "district"
  | "line"
  | "receiverName"
  | "receiverPhone"
  | "freightPhone"
  | "transport"
  | "shippingConsent"
  | "distanceSales"
  | "terms";

export interface CheckoutProblem {
  field: ProblemField;
  message: string;
}

/**
 * The element a problem is fixed in: its field's id, else the section that
 * holds it. Several ids are tried in turn, because a field only exists while
 * its card is open (the receiver's under "Yeni Adres" or the branch card).
 */
export const PROBLEM_TARGETS: Record<ProblemField, readonly string[]> = {
  quote: ["siparis-ozeti"],
  stock: ["cart-items-heading"],
  invoiceTitle: ["invoice-title", "invoice-heading"],
  invoiceLine: ["invoice-line", "invoice-heading"],
  invoiceCity: ["invoice-city", "invoice-heading"],
  invoiceDistrict: ["invoice-district", "invoice-heading"],
  taxOffice: ["invoice-tax-office", "invoice-heading"],
  taxNumber: ["invoice-tax-number", "invoice-heading"],
  branch: ["branch-name", "delivery-heading"],
  name: ["addr-name", "delivery-heading"],
  phone: ["contact-phone", "delivery-heading"],
  country: ["addr-country", "delivery-heading"],
  city: ["addr-city", "delivery-heading"],
  district: ["addr-district", "delivery-heading"],
  line: ["addr-line", "delivery-heading"],
  receiverName: ["new-receiver-name", "branch-receiver-name", "delivery-heading"],
  receiverPhone: ["new-receiver-phone", "branch-receiver-phone", "delivery-heading"],
  freightPhone: ["freight-phone", "delivery-heading"],
  transport: ["delivery-heading"],
  shippingConsent: ["shipping-consent"],
  distanceSales: ["agreement-distanceSales"],
  terms: ["agreement-terms"],
};

/** Each field's message, for the fields to show under themselves. */
export function errorsByField(problems: readonly CheckoutProblem[]): Partial<Record<ProblemField, string>> {
  const errors: Partial<Record<ProblemField, string>> = {};
  for (const { field, message } of problems) errors[field] ??= message;
  return errors;
}

/**
 * GA4's `checkout_validation_error`: which fields held the order up — their
 * names only, never what was typed — so the report can say which field loses
 * buyers. GA keeps a parameter to 100 characters.
 */
export function validationEventParams(problems: readonly CheckoutProblem[]) {
  const fields = [...new Set(problems.map((p) => p.field))];
  return {
    error_count: fields.length,
    first_field: fields[0] ?? "",
    fields: fields.join(",").slice(0, 100),
  };
}

/** The first of `ids` that is on the page. */
export function firstPresent(ids: readonly string[], byId: (id: string) => unknown): string | null {
  return ids.find((id) => byId(id) != null) ?? null;
}
