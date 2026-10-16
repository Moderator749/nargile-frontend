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
import type {
  AccountType,
  BillingEntity,
  InternationalAddress,
  InternationalKind,
  RegistrationCreate,
  StructuredAddress,
} from "@/types";

export const MIN_PASSWORD_LENGTH = 8;
const EMAIL = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;
const USERNAME = /^[A-Za-z0-9][A-Za-z0-9._-]{1,28}[A-Za-z0-9]$/;

/**
 * The four cards, by what the customer sells rather than how they are
 * registered: a kafe and a tobacco shop are approved on different documents and
 * bought from on different terms, while şahıs firması or şirket is a question
 * about the invoice and is asked in the invoice section.
 */
export const ACCOUNT_TYPES: { value: AccountType; title: string; cta: string }[] = [
  { value: "INDIVIDUAL", title: "Bireysel", cta: "Üye Ol" },
  { value: "CAFE", title: "Kafe & Restorant", cta: "Üye Ol" },
  { value: "TOBACCO_SHOP", title: "Nargile & Tobacco Shop", cta: "Üye Ol" },
  // In English, on purpose: whoever this card is for cannot read the others.
  { value: "INTERNATIONAL", title: "Yurt Dışı / International", cta: "Register" },
];

/** The two cards that are a Turkish firm, and are asked for an invoice identity. */
export const TURKISH_BUSINESS_TYPES: AccountType[] = ["CAFE", "TOBACCO_SHOP"];
export const isTurkishBusiness = (accountType: AccountType) =>
  TURKISH_BUSINESS_TYPES.includes(accountType);

/**
 * What an international customer buys for. Both are businesses — there is no
 * private export customer — so both are asked for a company name and a contact.
 */
export const INTERNATIONAL_KINDS: { value: InternationalKind; title: string; hint: string }[] = [
  { value: "WHOLESALER", title: "Wholesaler / Distributor", hint: "Buying to resell" },
  { value: "CAFE", title: "Cafe & Restaurant", hint: "Serving in your own venue" },
];

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

function addressProblem(address: AddressDraft, label: string): string | null {
  if (!address.city) return `${label} için şehir seçin.`;
  if (address.district.trim().length < 2) return `${label} için ilçe girin.`;
  if (!address.neighbourhood.trim() && !address.street.trim()) {
    return `${label} için mahalle/köy veya cadde/sokak girin.`;
  }
  return null;
}

function taxNumberProblem(company: CompanyDraft, entity: BillingEntity | ""): string | null {
  const given = company.tax_number.trim();
  if (entity === "COMPANY") {
    return isValidVkn(given) ? null : "Şirket vergi numarası 10 haneli olmalı.";
  }
  if (!isValidTaxId(given)) return "Vergi numarası 10 (VKN) veya 11 (TC) haneli olmalı.";
  return null;
}

function companyProblem(company: CompanyDraft, entity: BillingEntity | ""): string | null {
  if (company.title.trim().length < 2) return "Firma unvanını girin.";
  if (company.tax_plate_name.trim().length < 2) {
    return "Vergi levhasındaki isim / şirket adını girin.";
  }
  if (company.tax_office.trim().length < 2) return "Vergi dairesini girin.";
  return taxNumberProblem(company, entity);
}

function internationalProblem(draft: RegistrationDraft): string | null {
  const address = draft.internationalAddress;
  if (draft.company.title.trim().length < 2) return "Enter your company name.";
  if (draft.contactName.trim().length < 2) return "Enter the contact person's name.";
  if (!isValidInternationalPhone(draft.phone)) {
    return "Enter a valid mobile number, including the country code.";
  }
  if (!EMAIL.test(draft.email.trim())) return "Enter a valid email address.";
  if (draft.username.trim() && !USERNAME.test(draft.username.trim())) {
    return "A username is 3-30 characters: letters, numbers, dot, dash or underscore.";
  }
  if (draft.password.length < MIN_PASSWORD_LENGTH) {
    return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!address.country) return "Select your country.";
  if (address.city.trim().length < 2) return "Enter your city, state or province.";
  if (address.address_line1.trim().length < 3) {
    return "Enter your address: street and building number.";
  }
  // No check on the tax / VAT number: there are as many formats as there are
  // jurisdictions, and a wrong guess would turn a customer away.
  return null;
}

/** Mirrors the server's checks, in the order the fields appear; null = ready to send. */
export function registrationProblem(draft: RegistrationDraft): string | null {
  if (draft.accountType === "INTERNATIONAL") return internationalProblem(draft);
  const business = isTurkishBusiness(draft.accountType);

  if (business) {
    if (!draft.company.entity_type) return "Şahıs firması mı şirket mi olduğunuzu seçin.";
    const problem = companyProblem(draft.company, draft.company.entity_type);
    if (problem) return problem;
    if (draft.contactName.trim().length < 2) return "Yetkili kişinin adı soyadını girin.";
  } else if (draft.fullName.trim().length < 2) {
    return "İsim soyisim girin.";
  }

  if (!isValidPhone(draft.phone)) return "Geçerli bir cep telefonu girin.";
  if (draft.landlinePhone.trim() && !isValidPhone(draft.landlinePhone)) {
    return "Sabit telefon numarasını kontrol edin.";
  }
  if (!EMAIL.test(draft.email.trim())) return "Geçerli bir e-posta adresi girin.";
  if (draft.username.trim() && !USERNAME.test(draft.username.trim())) {
    return "Kullanıcı adı 3-30 karakter olmalı; harf, rakam, nokta, tire ve alt çizgi kullanılabilir.";
  }
  if (draft.password.length < MIN_PASSWORD_LENGTH) {
    return `Şifreniz en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  }
  // A şahıs firması is a person and may give theirs; a şirket is not asked.
  if (draft.nationalId.trim() && draft.company.entity_type !== "COMPANY" && !isValidTckn(draft.nationalId.trim())) {
    return "TC kimlik numarası 11 haneli ve geçerli olmalı.";
  }

  // A firm needs one for its invoice; an individual is invoiced where they say,
  // if they say — but a half-filled address is an error either way.
  if (business || addressTouched(draft.billing)) {
    const problem = addressProblem(draft.billing, "Fatura adresi");
    if (problem) return problem;
  }

  if (!business && draft.corporateInvoice) {
    if (!draft.company.entity_type) return "Faturanın şahıs firmasına mı şirkete mi kesileceğini seçin.";
    const problem =
      companyProblem(draft.company, draft.company.entity_type) ??
      addressProblem(draft.corporateAddress, "Kurumsal fatura adresi");
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
