import { EMPTY_ADDRESS, TURKEY, type AddressDraft } from "@/components/cart/delivery/addressDraft";
import { digitsOnly, isValidTaxId } from "@/lib/trIdentity";
import type { CorporateInvoiceDetails, InvoiceAddress } from "@/types";

/**
 * "Faturayı firmaya/şirkete istiyorum": who the invoice is made out to, and
 * where that firm is registered.
 *
 * The address here is the firm's official billing address — what the invoice
 * has to print. It is not where the parcel goes: the delivery step decides
 * that, and one of its cards points at this address precisely because the two
 * are kept apart.
 */
export interface InvoiceDraft {
  toCompany: boolean;
  /** Firma Ünvanı: the registered title on the tax certificate. */
  companyTitle: string;
  /** Firma Adı: what the firm is called day to day. Optional. */
  tradeName: string;
  /** Şirket resmi adresi; Turkish, like the tax document it belongs to. */
  city: string;
  district: string;
  line: string;
  taxOffice: string;
  taxNumber: string;
}

export const EMPTY_INVOICE: InvoiceDraft = {
  toCompany: false,
  companyTitle: "",
  tradeName: "",
  city: "",
  district: "",
  line: "",
  taxOffice: "",
  taxNumber: "",
};

/**
 * The draft to start from: what the account has on file, so a customer who
 * invoices to the same firm every time never types it twice. Blank for an
 * account that has never said, and while the read is still in flight.
 */
export function initialInvoice(onFile: CorporateInvoiceDetails | null): InvoiceDraft {
  if (!onFile) return EMPTY_INVOICE;
  return {
    toCompany: false,
    companyTitle: onFile.company_title,
    tradeName: onFile.trade_name ?? "",
    city: onFile.address.city,
    district: onFile.address.district,
    line: onFile.address.line,
    taxOffice: onFile.tax_office,
    taxNumber: onFile.tax_number,
  };
}

/**
 * Why this invoice cannot be issued yet, or null when it can. Mirrors
 * `CheckoutRequest._invoiceable` on the server, which refuses the same things —
 * a mistyped tax number is otherwise only discovered when the invoice is
 * rejected, and an invoice without an address is not a document at all.
 */
export function invoiceProblem(invoice: InvoiceDraft): string | null {
  if (!invoice.toCompany) return null;
  if (invoice.companyTitle.trim().length < 2) return "Fatura için firma ünvanını girin.";
  if (!invoice.city) return "Şirket resmi adresi için il seçin.";
  if (invoice.district.trim().length < 2) return "Şirket resmi adresi için ilçe girin.";
  if (invoice.line.trim().length < 5) return "Şirketin açık adresini girin.";
  if (invoice.taxOffice.trim().length < 2) return "Fatura için vergi dairesini girin.";
  if (!isValidTaxId(digitsOnly(invoice.taxNumber)))
    return "Vergi no 10 haneli VKN veya 11 haneli TC kimlik no olmalı.";
  return null;
}

/** Whether the firm's address is complete enough to be shown or shipped to. */
export const hasInvoiceAddress = (invoice: InvoiceDraft) =>
  !!invoice.city && invoice.district.trim().length >= 2 && invoice.line.trim().length >= 5;

/** What to call the firm on screen: its trade name when it has one. */
export const invoiceFirmName = (invoice: InvoiceDraft) =>
  invoice.tradeName.trim() || invoice.companyTitle.trim();

/** The firm's address on one line, for the card that delivers there. */
export function invoiceAddressSummary(invoice: InvoiceDraft): string {
  return [invoice.line.trim(), [invoice.district.trim(), invoice.city].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(", ");
}

/**
 * The firm's address as this order's delivery address.
 *
 * The parcel is addressed to the firm, so its name is the one on the label; the
 * number is the buyer's own, because that is who the carrier calls and the
 * invoice section never asks for a switchboard.
 */
export function invoiceShippingAddress(
  invoice: InvoiceDraft,
  contact: { full_name: string; phone: string },
): AddressDraft {
  return {
    ...EMPTY_ADDRESS,
    full_name: invoiceFirmName(invoice) || contact.full_name,
    phone: contact.phone,
    country: TURKEY,
    city: invoice.city,
    district: invoice.district.trim(),
    line: invoice.line.trim(),
  };
}

const address = (invoice: InvoiceDraft): InvoiceAddress => ({
  city: invoice.city,
  district: invoice.district.trim(),
  line: invoice.line.trim(),
});

/** The invoice as the checkout request carries it. */
export function toInvoicePayload(invoice: InvoiceDraft) {
  return invoice.toCompany
    ? {
        invoice_to_company: true,
        invoice_company_title: invoice.companyTitle.trim(),
        invoice_trade_name: invoice.tradeName.trim() || null,
        invoice_tax_office: invoice.taxOffice.trim(),
        invoice_tax_number: digitsOnly(invoice.taxNumber),
        invoice_address: address(invoice),
      }
    : { invoice_to_company: false };
}

/** The same details as the account keeps them, for "Hesabıma kaydet". */
export function toCorporatePayload(invoice: InvoiceDraft): CorporateInvoiceDetails {
  return {
    company_title: invoice.companyTitle.trim(),
    trade_name: invoice.tradeName.trim() || null,
    address: address(invoice),
    tax_office: invoice.taxOffice.trim(),
    tax_number: digitsOnly(invoice.taxNumber),
  };
}
