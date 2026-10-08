/**
 * The sign-up form's wording, in the two languages it is offered in.
 *
 * Turkish for the three domestic account types, English for the international
 * one — the customer who needs that branch cannot read the others. Only the
 * strings that both branches share live here; a section or field that exists in
 * one branch only carries its own label where it is written (`CompanyFields`,
 * `AddressFields`, `InternationalFields`), which is also where it can be read
 * next to what it belongs to.
 */

export interface RegistrationCopy {
  identitySection: string;
  identityHint?: string;
  contactSection: string;
  addressSection: string;
  addressHint?: string;
  contactPerson: string;
  mobile: string;
  mobilePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  username: string;
  usernameHint: string;
  password: string;
  passwordHint: (min: number) => string;
  submit: string;
  submitting: string;
}

const TR: RegistrationCopy = {
  identitySection: "Firma Bilgileri",
  identityHint: "Fatura bu bilgilerle kesilir; vergi levhanızdaki hâliyle girin.",
  contactSection: "Yetkili Kişi ve İletişim",
  addressSection: "Fatura Adresi",
  addressHint: "Faturanız ve siparişleriniz bu adrese düzenlenir.",
  contactPerson: "Yetkili Kişi Adı Soyadı",
  mobile: "Cep Telefonu",
  mobilePlaceholder: "05xx xxx xx xx",
  email: "E-posta",
  emailPlaceholder: "ornek@firma.com",
  username: "Kullanıcı Adı",
  usernameHint: "İsteğe bağlı · e-posta yerine bununla da giriş yapabilirsiniz",
  password: "Şifre",
  passwordHint: (min) => `En az ${min} karakter`,
  submit: "Hesap Oluştur",
  submitting: "Hesap oluşturuluyor…",
};

const EN: RegistrationCopy = {
  identitySection: "Company / Personal Identity",
  contactSection: "Contact & Login Details",
  addressSection: "Shipping & Billing Address",
  contactPerson: "Contact person name",
  mobile: "Mobile phone",
  mobilePlaceholder: "+49 30 1234 5678",
  email: "Email address",
  emailPlaceholder: "you@company.com",
  username: "Username",
  usernameHint: "Optional · you can sign in with this instead of your email",
  password: "Password",
  passwordHint: (min) => `At least ${min} characters`,
  submit: "Create account",
  submitting: "Creating your account…",
};

export const copyFor = (international: boolean): RegistrationCopy => (international ? EN : TR);
