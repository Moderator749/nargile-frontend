/**
 * The sign-up form's state and its checks, in one place.
 *
 * The form asks for different things depending on who is registering, so the
 * draft holds every field and `registrationProblem` decides which of them
 * matter. The checks mirror `app/schemas/registration.py`, in the order the
 * fields appear on screen, so the message always points at the next thing to
 * fix. The server validates again regardless — this only saves a round trip.
 *
 * Nothing here is about delivery or pricing: where an order goes is asked at
 * checkout, once there is an order to route, and which price group a firm
 * belongs to is an admin's to grant once there is an account to grant it on.
 */

import {
  isValidInternationalPhone,
  isValidPhone,
  isValidTaxId,
  isValidTckn,
  isValidVkn,
} from "@/lib/trIdentity";
import type { Locale } from "@/lib/i18n/config";
import {
  internationalMessages,
  registrationMessages,
  registrationProblemMessages,
} from "@/lib/i18n/messages/auth";
import type {
  AccountType,
  BillingEntity,
  InternationalAddress,
  InternationalKind,
  RegistrationCreate,
  StructuredAddress,
} from "@/types";

/** A customer's shortest password; mirrors CUSTOMER_PASSWORD_MIN (app/core/security.py). Admin accounts need 8, enforced by the server. */
export const MIN_PASSWORD_LENGTH = 6;
const EMAIL = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;
const USERNAME = /^[A-Za-z0-9][A-Za-z0-9._-]{1,28}[A-Za-z0-9]$/;

/**
 * The four cards, by what the customer sells rather than how they are
 * registered: a kafe and a tobacco shop are approved on different documents and
 * bought from on different terms, while şahıs firması or şirket is a question
 * about the invoice and is asked in the invoice section.
 */
const CARDS: AccountType[] = ["INDIVIDUAL", "CAFE", "TOBACCO_SHOP", "INTERNATIONAL"];
/** In Turkish; AccountTypePicker shows each card in the page's language (registrationMessages). */
export const ACCOUNT_TYPES: { value: AccountType; title: string; cta: string }[] = CARDS.map((value) => ({
  value,
  title: registrationMessages.tr.accountTypes[value],
  cta: value === "INTERNATIONAL" ? registrationMessages.tr.internationalCta : registrationMessages.tr.cta,
}));

/** The two cards that are a Turkish firm, and are asked for an invoice identity. */
export const TURKISH_BUSINESS_TYPES: AccountType[] = ["CAFE", "TOBACCO_SHOP"];
export const isTurkishBusiness = (accountType: AccountType) =>
  TURKISH_BUSINESS_TYPES.includes(accountType);

/**
 * What an international customer buys for. Both are businesses — there is no
 * private export customer — so both are asked for a company name and a contact.
 */
export const INTERNATIONAL_KINDS: { value: InternationalKind; title: string; hint: string }[] = (
  ["WHOLESALER", "CAFE"] as const
).map((value) => ({ value, ...internationalMessages.tr.kinds[value] }));

export interface AddressDraft {
  neighbourhood: string;
  street: string;
  building_no: string;
  building_name: string;
  door_no: string;
  district: string;
  city: string;
}

export interface InternationalAddressDraft {
  country: string;
  city: string;
  postal_code: string;
  address_line1: string;
  address_line2: string;
}

export interface CompanyDraft {
  /** Empty until an individual says which kind of firm to invoice. */
  entity_type: BillingEntity | "";
  title: string;
  tax_plate_name: string;
  tax_office: string;
  tax_number: string;
}

export interface RegistrationDraft {
  accountType: AccountType;
  email: string;
  password: string;
  username: string;
  /** İsim soyisim (bireysel). */
  fullName: string;
  /** Yetkili kişi (firma). */
  contactName: string;
  phone: string;
  landlinePhone: string;
  nationalId: string;
  billing: AddressDraft;
  /** "Faturayı firmaya/şirkete istiyorum" — individuals only. */
  corporateInvoice: boolean;
  company: CompanyDraft;
  /** The firm's own address, when the firm is somebody else's. */
  corporateAddress: AddressDraft;
  /** Business or private — the only identity question an international account is asked. */
  internationalKind: InternationalKind;
  /** The one address an international account gives: it is billed and shipped there. */
  internationalAddress: InternationalAddressDraft;
  /** Ticari elektronik ileti onayı — optional, never pre-ticked, the same on every card. */
  marketingConsent: boolean;
}

export const EMPTY_ADDRESS: AddressDraft = {
  neighbourhood: "",
  street: "",
  building_no: "",
  building_name: "",
  door_no: "",
  district: "",
  city: "",
};

export const EMPTY_INTERNATIONAL_ADDRESS: InternationalAddressDraft = {
  country: "",
  city: "",
  postal_code: "",
  address_line1: "",
  address_line2: "",
};

const EMPTY_COMPANY: CompanyDraft = {
  entity_type: "",
  title: "",
  tax_plate_name: "",
  tax_office: "",
  tax_number: "",
};

export function emptyDraft(accountType: AccountType = "INDIVIDUAL"): RegistrationDraft {
  return {
    accountType,
    email: "",
    password: "",
    username: "",
    fullName: "",
    contactName: "",
    phone: "",
    landlinePhone: "",
    nationalId: "",
    billing: { ...EMPTY_ADDRESS },
    corporateInvoice: false,
    company: { ...EMPTY_COMPANY },
    corporateAddress: { ...EMPTY_ADDRESS },
  internationalKind: "WHOLESALER",
    internationalAddress: { ...EMPTY_INTERNATIONAL_ADDRESS },
    marketingConsent: false,
  };
}

/**
 * Switching account type keeps what every account has — the login, the phone
 * numbers, the address — and drops what belongs to the type being left, so a
 * field that is no longer on screen can never be submitted.
 */
export function switchAccountType(draft: RegistrationDraft, accountType: AccountType): RegistrationDraft {
  const international = accountType === "INTERNATIONAL";
  const individual = accountType === "INDIVIDUAL";
  return {
    ...draft,
    accountType,
    // A TC number belongs to a person: an individual, or the owner of a şahıs
    // firması. It is nobody's abroad.
    nationalId: international ? "" : draft.nationalId,
    corporateInvoice: individual ? draft.corporateInvoice : false,
    // A firm's own identity and an individual's corporate invoice are the same
    // fields, so what was typed carries over — including which kind of firm it
    // is, which every Turkish branch asks for in the same words.
    company: international ? { ...draft.company, entity_type: "" } : draft.company,
  };
}

/** A TC number is a person's: an individual's, or a sole proprietor's. */
export function showsNationalId(draft: RegistrationDraft): boolean {
  if (draft.accountType === "INTERNATIONAL") return false;
  if (isTurkishBusiness(draft.accountType)) return draft.company.entity_type === "SOLE_PROPRIETOR";
  return true;
}

/** Whether anything at all was typed into an address. */
export function addressTouched(address: AddressDraft): boolean {
  return Object.values(address).some((value) => value.trim() !== "");
}

type DomesticWords = (typeof registrationProblemMessages)[Locale]["domestic"];

function addressProblem(address: AddressDraft, label: string, m: DomesticWords): string | null {
  if (!address.city) return m.city(label);
  if (address.district.trim().length < 2) return m.district(label);
  if (!address.neighbourhood.trim() && !address.street.trim()) {
    return m.street(label);
  }
  return null;
}

function taxNumberProblem(company: CompanyDraft, entity: BillingEntity | "", m: DomesticWords): string | null {
  const given = company.tax_number.trim();
  if (entity === "COMPANY") {
    return isValidVkn(given) ? null : m.companyVkn;
  }
  if (!isValidTaxId(given)) return m.taxId;
  return null;
}

function companyProblem(company: CompanyDraft, entity: BillingEntity | "", m: DomesticWords): string | null {
  if (company.title.trim().length < 2) return m.companyTitle;
  if (company.tax_plate_name.trim().length < 2) {
    return m.platename;
  }
  if (company.tax_office.trim().length < 2) return m.taxOffice;
  return taxNumberProblem(company, entity, m);
}

function internationalProblem(draft: RegistrationDraft, locale: Locale): string | null {
  const m = registrationProblemMessages[locale].international;
  const address = draft.internationalAddress;
  if (draft.company.title.trim().length < 2) return m.companyTitle;
  if (draft.contactName.trim().length < 2) return m.contactName;
  if (!isValidInternationalPhone(draft.phone)) {
    return m.phone;
  }
  if (!EMAIL.test(draft.email.trim())) return m.email;
  if (draft.username.trim() && !USERNAME.test(draft.username.trim())) {
    return m.username;
  }
  if (draft.password.length < MIN_PASSWORD_LENGTH) {
    return m.password(MIN_PASSWORD_LENGTH);
  }
  if (!address.country) return m.country;
  if (address.city.trim().length < 2) return m.city;
  if (address.address_line1.trim().length < 3) {
    return m.address;
  }
  // No check on the tax / VAT number: there are as many formats as there are
  // jurisdictions, and a wrong guess would turn a customer away.
  return null;
}

/**
 * Mirrors the server's checks, in the order the fields appear; null = ready to
 * send. The message is in `locale` (Turkish by default, where the
 * international branch is answered in English, like its form).
 */
export function registrationProblem(draft: RegistrationDraft, locale: Locale = "tr"): string | null {
  if (draft.accountType === "INTERNATIONAL") return internationalProblem(draft, locale);
  const m = registrationProblemMessages[locale].domestic;
  const business = isTurkishBusiness(draft.accountType);

  if (business) {
    if (!draft.company.entity_type) return m.entity;
    const problem = companyProblem(draft.company, draft.company.entity_type, m);
    if (problem) return problem;
    if (draft.contactName.trim().length < 2) return m.contactName;
  } else if (draft.fullName.trim().length < 2) {
    return m.fullName;
  }

  if (!isValidPhone(draft.phone)) return m.phone;
  if (draft.landlinePhone.trim() && !isValidPhone(draft.landlinePhone)) {
    return m.landline;
  }
  if (!EMAIL.test(draft.email.trim())) return m.email;
  if (draft.username.trim() && !USERNAME.test(draft.username.trim())) {
    return m.username;
  }
  if (draft.password.length < MIN_PASSWORD_LENGTH) {
    return m.password(MIN_PASSWORD_LENGTH);
  }
  // A şahıs firması is a person and may give theirs; a şirket is not asked.
  if (draft.nationalId.trim() && draft.company.entity_type !== "COMPANY" && !isValidTckn(draft.nationalId.trim())) {
    return m.nationalId;
  }

  // A firm needs one for its invoice; an individual is invoiced where they say,
  // if they say — but a half-filled address is an error either way.
  if (business || addressTouched(draft.billing)) {
    const problem = addressProblem(draft.billing, m.billingAddress, m);
    if (problem) return problem;
  }

  if (!business && draft.corporateInvoice) {
    if (!draft.company.entity_type) return m.invoiceEntity;
    const problem =
      companyProblem(draft.company, draft.company.entity_type, m) ??
      addressProblem(draft.corporateAddress, m.corporateAddress, m);
    if (problem) return problem;
  }

  return null;
}

const trimmed = (value: string) => value.trim() || null;

function toAddress(address: AddressDraft): StructuredAddress {
  return {
    neighbourhood: trimmed(address.neighbourhood),
    street: trimmed(address.street),
    building_no: trimmed(address.building_no),
    building_name: trimmed(address.building_name),
    door_no: trimmed(address.door_no),
    district: address.district.trim(),
    city: address.city,
  };
}

function toInternationalAddress(address: InternationalAddressDraft): InternationalAddress {
  return {
    country: address.country,
    city: address.city.trim(),
    postal_code: trimmed(address.postal_code),
    address_line1: address.address_line1.trim(),
    address_line2: trimmed(address.address_line2),
  };
}

function toInternationalPayload(draft: RegistrationDraft): RegistrationCreate {
  return {
    account_type: "INTERNATIONAL",
    international_kind: draft.internationalKind,
    email: draft.email.trim(),
    password: draft.password,
    username: trimmed(draft.username),
    // Both kinds are a firm, and a firm's name is its contact's.
    full_name: null,
    contact_name: draft.contactName.trim(),
    phone: draft.phone.trim(),
    // A TC number, a vergi dairesi and the name on a tax plate are Turkish
    // fields; the server refuses them here, and nothing on screen asks for them.
    national_id: null,
    company: {
      entity_type: null,
      title: draft.company.title.trim(),
      tax_plate_name: null,
      tax_office: null,
      tax_number: trimmed(draft.company.tax_number),
      address: null,
    },
    billing_address: toInternationalAddress(draft.internationalAddress),
    marketing_consent: draft.marketingConsent,
  };
}

/** The draft as the server's registration payload: only the fields the chosen account type has. */
export function toPayload(draft: RegistrationDraft): RegistrationCreate {
  if (draft.accountType === "INTERNATIONAL") return toInternationalPayload(draft);
  const business = isTurkishBusiness(draft.accountType);
  const sendCompany = business || draft.corporateInvoice;
  return {
    account_type: draft.accountType,
    email: draft.email.trim(),
    password: draft.password,
    username: trimmed(draft.username),
    full_name: business ? null : draft.fullName.trim(),
    contact_name: business ? draft.contactName.trim() : null,
    phone: draft.phone.trim(),
    landline_phone: trimmed(draft.landlinePhone),
    // A şirket has no TC number; the field is not on screen for one either.
    national_id: draft.company.entity_type === "COMPANY" && sendCompany ? null : trimmed(draft.nationalId),
    company: sendCompany
      ? {
          entity_type: (draft.company.entity_type as BillingEntity) || null,
          title: draft.company.title.trim(),
          // The name on the vergi levhası, asked of whoever is being invoiced.
          tax_plate_name: draft.company.tax_plate_name.trim(),
          tax_office: draft.company.tax_office.trim(),
          tax_number: draft.company.tax_number.trim(),
          // A business account's own address is its firm's, and is sent as the
          // billing address; only a borrowed firm has one of its own.
          address: business ? null : toAddress(draft.corporateAddress),
        }
      : null,
    billing_address: business || addressTouched(draft.billing) ? toAddress(draft.billing) : null,
    marketing_consent: draft.marketingConsent,
  };
}
