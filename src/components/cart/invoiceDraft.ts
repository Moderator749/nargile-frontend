import { digitsOnly, isValidVkn } from "@/lib/trIdentity";

/** "Faturayı firmaya/şirkete istiyorum" and who to make it out to. */
export interface InvoiceDraft {
  toCompany: boolean;
  companyTitle: string;
  taxOffice: string;
  taxNumber: string;
}

export const EMPTY_INVOICE: InvoiceDraft = {
  toCompany: false,
  companyTitle: "",
  taxOffice: "",
  taxNumber: "",
};

/**
 * Why this invoice cannot be issued yet, or null when it can. Mirrors
 * `CheckoutRequest._invoiceable` on the server, which refuses the same things —
 * a mistyped VKN is otherwise only discovered when the invoice is rejected.
 */
export function invoiceProblem(invoice: InvoiceDraft): string | null {
  if (!invoice.toCompany) return null;
  if (invoice.companyTitle.trim().length < 2) return "Fatura için firma ünvanını girin.";
  if (invoice.taxOffice.trim().length < 2) return "Fatura için vergi dairesini girin.";
  if (!isValidVkn(digitsOnly(invoice.taxNumber))) return "Vergi numarası 10 haneli olmalı.";
  return null;
}

/** The invoice as the checkout request carries it. */
export function toInvoicePayload(invoice: InvoiceDraft) {
  return invoice.toCompany
    ? {
        invoice_to_company: true,
        invoice_company_title: invoice.companyTitle.trim(),
        invoice_tax_office: invoice.taxOffice.trim(),
        invoice_tax_number: digitsOnly(invoice.taxNumber),
      }
    : { invoice_to_company: false };
}
