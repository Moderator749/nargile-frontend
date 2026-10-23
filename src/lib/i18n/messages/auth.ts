/**
 * Sign-in, sign-up and password reset, plus the API error texts lib/errors.ts
 * maps backend details onto.
 *
 * The sign-up form has two branches: the domestic one (Bireysel, Kafe, Nargile
 * & Tobacco Shop) and the international one. In Turkish the international
 * branch stays in English, as it always was — the customer who needs it cannot
 * read Turkish; in English and Arabic both branches are in the page's language.
 */

import { EXPORT_NOTICE } from "@/lib/exportAccount";
import { defineMessages } from "@/lib/i18n/messages";
import type { AccountType, B2BSegment, BillingEntity, InternationalKind } from "@/types";

/* ------------------------------------------------------------------ pages */

export const authPageMessages = defineMessages({
  tr: {
    login: {
      metaTitle: "Giriş Yap",
      metaDescription: "Hesabınıza giriş yapın; size özel kafe, toptan ve bayi fiyatlarına erişin.",
      title: "Hoş geldiniz",
      subtitle: "Siparişlerinize ve size özel fiyatlara erişmek için giriş yapın.",
      noAccount: "Hesabınız yok mu?",
      signUp: "Üye olun",
    },
    register: {
      metaTitle: "Kayıt Ol",
      metaDescription:
        "Bireysel, şahıs firması veya şirket olarak ücretsiz hesap oluşturun; siparişlerinizi takip edin ve Sultan Puan kazanın.",
      title: "Hesap oluşturun",
      subtitle: "Hesap türünüzü seçin; yalnızca size uygun alanlar sorulur.",
      haveAccount: "Zaten hesabınız var mı?",
      signIn: "Giriş yapın",
    },
    reset: {
      metaTitle: "Şifre Yenile",
      metaDescription: "Hesabınız için yeni bir şifre belirleyin.",
      title: "Yeni şifre belirleyin",
      subtitle: "Hesabınız için yeni bir şifre seçin.",
    },
    forgot: {
      metaTitle: "Şifremi Unuttum",
      metaDescription: "Şifrenizi e-posta bağlantısı ya da SMS koduyla yenileyin.",
      title: "Şifremi unuttum",
      subtitle: "Şifrenizi e-postanıza gelen bağlantıyla ya da cep telefonunuza gelen kodla yenileyin.",
    },
    backToLogin: "Giriş sayfasına dön",
  },
  en: {
    login: {
      metaTitle: "Sign In",
      metaDescription: "Sign in to your account to see your café, wholesale and dealer prices.",
      title: "Welcome back",
      subtitle: "Sign in to see your orders and the prices set for you.",
      noAccount: "Don't have an account?",
      signUp: "Sign up",
    },
    register: {
      metaTitle: "Create Account",
      metaDescription:
        "Create a free account as an individual, sole trader or company; track your orders and earn Sultan Puan.",
      title: "Create your account",
      subtitle: "Choose your account type; you will only be asked what applies to you.",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
    },
    reset: {
      metaTitle: "Reset Password",
      metaDescription: "Set a new password for your account.",
      title: "Set a new password",
      subtitle: "Choose a new password for your account.",
    },
    forgot: {
      metaTitle: "Forgot Password",
      metaDescription: "Reset your password with an email link or an SMS code.",
      title: "Forgot your password?",
      subtitle: "Reset your password with the link sent to your email or the code sent to your mobile phone.",
    },
    backToLogin: "Back to sign in",
  },
  ar: {
    login: {
      metaTitle: "تسجيل الدخول",
      metaDescription: "سجّل الدخول إلى حسابك لتصل إلى أسعار المقاهي والجملة والموزعين الخاصة بك.",
      title: "أهلاً بك",
      subtitle: "سجّل الدخول لمتابعة طلباتك والوصول إلى الأسعار الخاصة بك.",
      noAccount: "ليس لديك حساب؟",
      signUp: "أنشئ حساباً",
    },
    register: {
      metaTitle: "إنشاء حساب",
      metaDescription: "أنشئ حساباً مجانياً كفرد أو مؤسسة فردية أو شركة؛ تابع طلباتك واكسب نقاط Sultan Puan.",
      title: "أنشئ حسابك",
      subtitle: "اختر نوع حسابك؛ لن نسألك إلا عمّا يخصك.",
      haveAccount: "لديك حساب بالفعل؟",
      signIn: "سجّل الدخول",
    },
    reset: {
      metaTitle: "إعادة تعيين كلمة المرور",
      metaDescription: "عيّن كلمة مرور جديدة لحسابك.",
      title: "عيّن كلمة مرور جديدة",
      subtitle: "اختر كلمة مرور جديدة لحسابك.",
    },
    forgot: {
      metaTitle: "نسيت كلمة المرور",
      metaDescription: "أعد تعيين كلمة المرور عبر رابط بالبريد الإلكتروني أو رمز برسالة SMS.",
      title: "نسيت كلمة المرور",
      subtitle: "أعد تعيين كلمة المرور بالرابط المرسل إلى بريدك الإلكتروني أو بالرمز المرسل إلى جوالك.",
    },
    backToLogin: "العودة إلى تسجيل الدخول",
  },
});

/* ------------------------------------------------------------------ sign-in */

export const loginMessages = defineMessages({
  tr: {
    notices: {
      account: "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
      review:
        "Hesabınız oluşturuldu. Firma başvurunuz incelenecek; onaylanınca size özel fiyatlar tanımlanır. Şimdi giriş yapabilirsiniz.",
      // In English, like the form this visitor came from.
      export:
        "Your account has been created. Our sales team will contact you about wholesale pricing and shipping rates. You can sign in now.",
    },
    identifier: "E-posta veya kullanıcı adı",
    identifierPlaceholder: "ornek@firma.com",
    password: "Şifre",
    forgot: "Şifremi unuttum",
    submit: "Giriş Yap",
    submitting: "Giriş yapılıyor…",
    failed: "Giriş yapılamadı. Lütfen tekrar deneyin.",
  },
  en: {
    notices: {
      account: "Your account has been created. You can sign in now.",
      review:
        "Your account has been created. We will review your business application; once it is approved, your prices are set up for you. You can sign in now.",
      export:
        "Your account has been created. Our sales team will contact you about wholesale pricing and shipping rates. You can sign in now.",
    },
    identifier: "Email or username",
    identifierPlaceholder: "name@company.com",
    password: "Password",
    forgot: "Forgot your password?",
    submit: "Sign In",
    submitting: "Signing in…",
    failed: "We couldn't sign you in. Please try again.",
  },
  ar: {
    notices: {
      account: "تم إنشاء حسابك. يمكنك تسجيل الدخول الآن.",
      review:
        "تم إنشاء حسابك. سنراجع طلب حساب الشركة، وبعد الموافقة تُفعَّل الأسعار الخاصة بك. يمكنك تسجيل الدخول الآن.",
      export: "تم إنشاء حسابك. سيتواصل معك فريق المبيعات بشأن أسعار الجملة وتكاليف الشحن. يمكنك تسجيل الدخول الآن.",
    },
    identifier: "البريد الإلكتروني أو اسم المستخدم",
    identifierPlaceholder: "name@company.com",
    password: "كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    submit: "تسجيل الدخول",
    submitting: "جارٍ تسجيل الدخول…",
    failed: "تعذّر تسجيل الدخول. يرجى المحاولة مرة أخرى.",
  },
});

/* ------------------------------------------------------------------ password reset */

export const passwordMessages = defineMessages({
  tr: {
    byEmail: "E-posta ile",
    bySms: "SMS ile",
    method: "Yenileme yöntemi",
    identifier: "E-posta veya kullanıcı adı",
    identifierPlaceholder: "ornek@firma.com",
    identifierHint: "Kayıtlıysanız şifre yenileme bağlantısı e-postanıza gelir.",
    phone: "Cep telefonu",
    phonePlaceholder: "0532 123 45 67",
    phoneHint: "Hesabınızda kayıtlı cep telefonuna 6 haneli kod gelir.",
    sendLink: "Bağlantı gönder",
    sendCode: "Kod gönder",
    requestFailed: "İstek gönderilemedi, lütfen tekrar deneyin.",
    enterSmsCode: "SMS ile gelen 6 haneli kodu girin.",
    smsCode: "SMS kodu",
    newPassword: "Yeni şifre",
    repeatPassword: "Yeni şifre (tekrar)",
    minLength: (min: number) => `En az ${min} karakter.`,
    change: "Şifreyi değiştir",
    changeFailed: "Şifre değiştirilemedi.",
    mismatch: "Şifreler aynı değil.",
    noCode: "Kod gelmedi mi? Tekrar gönder",
    emailSentHint:
      "E-postadaki bağlantı 30 dakika geçerlidir ve bir kez kullanılabilir. Gelen kutunuzda göremezseniz istenmeyen (spam) klasörüne de bakın.",
    resend: "Tekrar gönder",
    signIn: "Giriş yap",
    invalidLink: "Bu bağlantı geçersiz, kullanılmış ya da süresi dolmuş.",
    newLink: "Yeni bağlantı iste",
    backToLogin: "Giriş sayfasına dön",
  },
  en: {
    byEmail: "By email",
    bySms: "By SMS",
    method: "Reset method",
    identifier: "Email or username",
    identifierPlaceholder: "name@company.com",
    identifierHint: "If you have an account, a password reset link will be sent to your email.",
    phone: "Mobile phone",
    phonePlaceholder: "0532 123 45 67",
    phoneHint: "A 6-digit code will be sent to the mobile number on your account.",
    sendLink: "Send link",
    sendCode: "Send code",
    requestFailed: "We couldn't send the request. Please try again.",
    enterSmsCode: "Enter the 6-digit code we sent by SMS.",
    smsCode: "SMS code",
    newPassword: "New password",
    repeatPassword: "New password (again)",
    minLength: (min: number) => `At least ${min} characters.`,
    change: "Change password",
    changeFailed: "We couldn't change your password.",
    mismatch: "The passwords don't match.",
    noCode: "Didn't get a code? Send it again",
    emailSentHint:
      "The link in the email is valid for 30 minutes and can be used once. If you can't find it in your inbox, check your spam folder too.",
    resend: "Send again",
    signIn: "Sign in",
    invalidLink: "This link is invalid, has already been used or has expired.",
    newLink: "Request a new link",
    backToLogin: "Back to sign in",
  },
  ar: {
    byEmail: "عبر البريد الإلكتروني",
    bySms: "عبر رسالة SMS",
    method: "طريقة إعادة التعيين",
    identifier: "البريد الإلكتروني أو اسم المستخدم",
    identifierPlaceholder: "name@company.com",
    identifierHint: "إذا كان لديك حساب، فسيصلك رابط إعادة تعيين كلمة المرور على بريدك الإلكتروني.",
    phone: "رقم الجوال",
    phonePlaceholder: "0532 123 45 67",
    phoneHint: "سيصلك رمز من 6 أرقام على رقم الجوال المسجّل في حسابك.",
    sendLink: "أرسل الرابط",
    sendCode: "أرسل الرمز",
    requestFailed: "تعذّر إرسال الطلب، يرجى المحاولة مرة أخرى.",
    enterSmsCode: "أدخل الرمز المكوّن من 6 أرقام الذي وصلك برسالة SMS.",
    smsCode: "رمز SMS",
    newPassword: "كلمة المرور الجديدة",
    repeatPassword: "كلمة المرور الجديدة (مرة أخرى)",
    minLength: (min: number) => `${min} أحرف على الأقل.`,
    change: "تغيير كلمة المرور",
    changeFailed: "تعذّر تغيير كلمة المرور.",
    mismatch: "كلمتا المرور غير متطابقتين.",
    noCode: "لم يصلك الرمز؟ أعد الإرسال",
    emailSentHint:
      "الرابط في البريد الإلكتروني صالح لمدة 30 دقيقة ويُستخدم مرة واحدة. إن لم تجده في صندوق الوارد فتحقّق من مجلد الرسائل غير المرغوب فيها (Spam).",
    resend: "أعد الإرسال",
    signIn: "تسجيل الدخول",
    invalidLink: "هذا الرابط غير صالح أو استُخدم من قبل أو انتهت صلاحيته.",
    newLink: "اطلب رابطاً جديداً",
    backToLogin: "العودة إلى تسجيل الدخول",
  },
});

/* ------------------------------------------------------------------ sign-up */

/** The wording both branches of the sign-up form share (components/auth/registrationCopy). */
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
  /** The optional ticari elektronik ileti box, and the name of the text its link opens. */
  marketingConsent: string;
  marketingConsentHint: string;
  readPrivacy: string;
}

const TR_DOMESTIC: RegistrationCopy = {
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
  marketingConsent:
    "Kampanya, indirim ve duyurulardan haberdar olmak için ticari elektronik ileti (SMS ve E-posta) almayı onaylıyorum.",
  marketingConsentHint:
    "İsteğe bağlı. Sipariş ve şifre mesajları bu onaydan bağımsız gönderilir; tercihinizi hesabınızdan her zaman değiştirebilirsiniz.",
  readPrivacy: "Gizlilik Kuralları",
};

const EN_INTERNATIONAL: RegistrationCopy = {
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
  marketingConsent: "I agree to receive commercial electronic messages (SMS and e-mail) about campaigns, discounts and news.",
  marketingConsentHint:
    "Optional. Order and password messages are sent regardless; you can change this in your account at any time.",
  readPrivacy: "Privacy Policy",
};

const EN_DOMESTIC: RegistrationCopy = {
  ...EN_INTERNATIONAL,
  identitySection: "Company Details",
  identityHint: "Your invoice is issued with these details; enter them exactly as on your tax certificate (vergi levhası).",
  contactSection: "Authorised Person & Contact",
  addressSection: "Billing Address",
  addressHint: "Your invoices and orders are issued to this address.",
  contactPerson: "Authorised person's full name",
  mobilePlaceholder: "05xx xxx xx xx",
  emailPlaceholder: "name@company.com",
};

const AR_INTERNATIONAL: RegistrationCopy = {
  identitySection: "بيانات الشركة",
  contactSection: "بيانات التواصل وتسجيل الدخول",
  addressSection: "عنوان الشحن والفوترة",
  contactPerson: "اسم الشخص المسؤول",
  mobile: "رقم الجوال",
  mobilePlaceholder: "+966 50 123 4567",
  email: "البريد الإلكتروني",
  emailPlaceholder: "name@company.com",
  username: "اسم المستخدم",
  usernameHint: "اختياري · يمكنك تسجيل الدخول به بدلاً من بريدك الإلكتروني",
  password: "كلمة المرور",
  passwordHint: (min) => `${min} أحرف على الأقل`,
  submit: "إنشاء الحساب",
  submitting: "جارٍ إنشاء حسابك…",
  marketingConsent:
    "أوافق على تلقّي رسائل إلكترونية تجارية (SMS وبريد إلكتروني) لأبقى على اطلاع بالحملات والخصومات والإعلانات.",
  marketingConsentHint:
    "اختياري. تُرسَل رسائل الطلبات وكلمة المرور بغض النظر عن هذه الموافقة، ويمكنك تغيير اختيارك من حسابك في أي وقت.",
  readPrivacy: "سياسة الخصوصية",
};

const AR_DOMESTIC: RegistrationCopy = {
  ...AR_INTERNATIONAL,
  identityHint: "تصدر الفاتورة بهذه البيانات؛ أدخلها كما هي في شهادتك الضريبية (vergi levhası).",
  contactSection: "الشخص المسؤول والتواصل",
  addressSection: "عنوان الفاتورة",
  addressHint: "تصدر فواتيرك وطلباتك على هذا العنوان.",
  contactPerson: "الاسم الكامل للشخص المسؤول",
  mobilePlaceholder: "05xx xxx xx xx",
};

export const registrationMessages = defineMessages<{
  domestic: RegistrationCopy;
  international: RegistrationCopy;
  accountType: string;
  /** The card titles and their button, by account type. */
  accountTypes: Record<AccountType, string>;
  cta: string;
  internationalCta: string;
  /** Either side of the card's button name; `after` carries its own leading space. */
  pickFirst: [before: string, after: string];
  documentNoticeLabel: string;
  documentNotice: string;
  personalSection: string;
  fullName: string;
  fullNamePlaceholder: string;
  landline: string;
  optional: string;
  nationalId: string;
  nationalIdHint: string;
  corporateInvoiceSection: string;
  corporateInvoice: string;
  corporateInvoiceHint: string;
  address: string;
  privacyFailed: string;
  failed: string;
}>({
  tr: {
    domestic: TR_DOMESTIC,
    international: EN_INTERNATIONAL,
    accountType: "Hesap türü",
    accountTypes: {
      INDIVIDUAL: "Bireysel",
      CAFE: "Kafe & Restoran",
      TOBACCO_SHOP: "Nargile & Tobacco Shop",
      // In English, on purpose: whoever this card is for cannot read the others.
      INTERNATIONAL: "Yurt Dışı / International",
      SOLE_PROPRIETOR: "Şahıs Firması",
      COMPANY: "Şirket",
    },
    cta: "Üye Ol",
    internationalCta: "Register",
    pickFirst: ["Hesap türünüzü seçip", " düğmesine basın; yalnızca size uygun alanlar sorulacak."],
    documentNoticeLabel: "NOT:",
    documentNotice: "Üyelik onayında vergi levhası ve varsa TAPDK belgesi istenecektir.",
    personalSection: "Kişisel Bilgiler",
    fullName: "İsim Soyisim",
    fullNamePlaceholder: "Adınız Soyadınız",
    landline: "Sabit Telefon",
    optional: "İsteğe bağlı",
    nationalId: "TC Kimlik No",
    nationalIdHint: "İsteğe bağlı · fatura ve kargo işlemlerini hızlandırır",
    corporateInvoiceSection: "Kurumsal Fatura",
    corporateInvoice: "Faturayı Firmaya / Şirkete İstiyorum",
    corporateInvoiceHint: "Fatura bir firma adına kesilsin. Fiyatlarınız değişmez.",
    address: "Adres",
    privacyFailed: "Metin yüklenemedi. Sayfayı yenileyip tekrar deneyebilirsiniz.",
    failed: "Kayıt tamamlanamadı. Lütfen tekrar deneyin.",
  },
  en: {
    domestic: EN_DOMESTIC,
    international: EN_INTERNATIONAL,
    accountType: "Account type",
    accountTypes: {
      INDIVIDUAL: "Individual",
      CAFE: "Café & lounge",
      TOBACCO_SHOP: "Hookah & tobacco shop",
      INTERNATIONAL: "International / export",
      SOLE_PROPRIETOR: "Sole trader",
      COMPANY: "Company",
    },
    cta: "Sign up",
    internationalCta: "Sign up",
    pickFirst: ["Choose your account type and press", "; you will only be asked what applies to you."],
    documentNoticeLabel: "NOTE:",
    documentNotice:
      "To approve your account we will ask for your tax certificate (vergi levhası) and, if you have one, your TAPDK licence.",
    personalSection: "Personal Details",
    fullName: "Full name",
    fullNamePlaceholder: "Your first and last name",
    landline: "Landline",
    optional: "Optional",
    nationalId: "Turkish ID number (TC Kimlik)",
    nationalIdHint: "Optional · speeds up invoicing and shipping",
    corporateInvoiceSection: "Business Invoice",
    corporateInvoice: "Invoice my order to a business",
    corporateInvoiceHint: "The invoice is issued in a business's name. Your prices stay the same.",
    address: "Address",
    privacyFailed: "The text couldn't be loaded. Refresh the page and try again.",
    failed: "We couldn't complete your registration. Please try again.",
  },
  ar: {
    domestic: AR_DOMESTIC,
    international: AR_INTERNATIONAL,
    accountType: "نوع الحساب",
    accountTypes: {
      INDIVIDUAL: "أفراد",
      CAFE: "مقاهي ولاونج",
      TOBACCO_SHOP: "متجر شيشة وتبغ",
      INTERNATIONAL: "خارج تركيا / تصدير",
      SOLE_PROPRIETOR: "مؤسسة فردية",
      COMPANY: "شركة",
    },
    cta: "إنشاء حساب",
    internationalCta: "إنشاء حساب",
    pickFirst: ["اختر نوع حسابك ثم اضغط زر", "؛ لن نسألك إلا عن الحقول التي تخصك."],
    documentNoticeLabel: "ملاحظة:",
    documentNotice: "للموافقة على العضوية سنطلب شهادتك الضريبية (vergi levhası) ورخصة TAPDK إن وُجدت.",
    personalSection: "البيانات الشخصية",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "الاسم واسم العائلة",
    landline: "الهاتف الأرضي",
    optional: "اختياري",
    nationalId: "رقم الهوية التركية (TC Kimlik)",
    nationalIdHint: "اختياري · يسرّع إصدار الفاتورة والشحن",
    corporateInvoiceSection: "فاتورة باسم شركة",
    corporateInvoice: "أريد الفاتورة باسم مؤسسة / شركة",
    corporateInvoiceHint: "تصدر الفاتورة باسم مؤسسة. أسعارك لا تتغير.",
    address: "العنوان",
    privacyFailed: "تعذّر تحميل النص. يمكنك تحديث الصفحة والمحاولة مرة أخرى.",
    failed: "تعذّر إتمام التسجيل. يرجى المحاولة مرة أخرى.",
  },
});

/** The Turkish invoice fields: firm type, tax plate, tax office and number, and the address. */
export const companyFieldMessages = defineMessages<{
  entityType: string;
  entities: Record<BillingEntity, string>;
  title: string;
  titlePlaceholder: string;
  plateSole: string;
  plateCompany: string;
  plateEither: string;
  plateHint: string;
  taxOffice: string;
  taxNumber: string;
  taxNumberHint: string;
  nationalId: string;
  optional: string;
  address: {
    neighbourhood: string;
    street: string;
    buildingNo: string;
    buildingName: string;
    doorNo: string;
    district: string;
    city: string;
    selectCity: string;
  };
}>({
  tr: {
    entityType: "Firma türü",
    entities: { SOLE_PROPRIETOR: "Şahıs Firması", COMPANY: "Şirket (Limited/A.Ş.)" },
    title: "Unvan",
    titlePlaceholder: "Fatura üzerinde görünecek unvan",
    plateSole: "İsim Soyisim",
    plateCompany: "Şirket Adı",
    plateEither: "İsim Soyisim / Şirket Adı",
    plateHint: "Vergi levhasındaki hâliyle",
    taxOffice: "Vergi Dairesi",
    taxNumber: "Vergi Numarası",
    taxNumberHint: "10 haneli VKN",
    nationalId: "TC Kimlik No",
    optional: "İsteğe bağlı",
    address: {
      neighbourhood: "Mahalle / Köy",
      street: "Cadde / Sokak",
      buildingNo: "Bina No",
      buildingName: "Bina Adı",
      doorNo: "Kapı No",
      district: "İlçe",
      city: "Şehir",
      selectCity: "Şehir seçin",
    },
  },
  en: {
    entityType: "Business type",
    entities: { SOLE_PROPRIETOR: "Sole trader (Şahıs firması)", COMPANY: "Company (Ltd. / A.Ş.)" },
    title: "Trade name",
    titlePlaceholder: "The name to appear on the invoice",
    plateSole: "Full name",
    plateCompany: "Company name",
    plateEither: "Full name / Company name",
    plateHint: "As on your tax certificate (vergi levhası)",
    taxOffice: "Tax office",
    taxNumber: "Tax number",
    taxNumberHint: "10-digit VKN",
    nationalId: "Turkish ID number (TC Kimlik)",
    optional: "Optional",
    address: {
      neighbourhood: "Neighbourhood / Village",
      street: "Street",
      buildingNo: "Building no.",
      buildingName: "Building name",
      doorNo: "Flat / Door no.",
      district: "District",
      city: "Province",
      selectCity: "Select a province",
    },
  },
  ar: {
    entityType: "نوع المنشأة",
    entities: { SOLE_PROPRIETOR: "مؤسسة فردية (Şahıs firması)", COMPANY: "شركة (Ltd. / A.Ş.)" },
    title: "الاسم التجاري",
    titlePlaceholder: "الاسم الذي سيظهر على الفاتورة",
    plateSole: "الاسم الكامل",
    plateCompany: "اسم الشركة",
    plateEither: "الاسم الكامل / اسم الشركة",
    plateHint: "كما هو في الشهادة الضريبية (vergi levhası)",
    taxOffice: "مكتب الضرائب",
    taxNumber: "الرقم الضريبي",
    taxNumberHint: "رقم VKN من 10 أرقام",
    nationalId: "رقم الهوية التركية (TC Kimlik)",
    optional: "اختياري",
    address: {
      neighbourhood: "الحي / القرية",
      street: "الشارع",
      buildingNo: "رقم المبنى",
      buildingName: "اسم المبنى",
      doorNo: "رقم الشقة / الباب",
      district: "المنطقة",
      city: "المحافظة",
      selectCity: "اختر المحافظة",
    },
  },
});

/** The international branch: what the customer buys for, the company, the address abroad. */
export const internationalMessages = defineMessages<{
  kind: string;
  kinds: Record<InternationalKind, { title: string; hint: string }>;
  companyName: string;
  taxId: string;
  taxIdHint: string;
  country: string;
  selectCountry: string;
  city: string;
  postalCode: string;
  optional: string;
  line1: string;
  line1Placeholder: string;
  line2: string;
  line2Hint: string;
  customs: string;
}>({
  tr: {
    kind: "Account kind",
    kinds: {
      WHOLESALER: { title: "Wholesaler / Distributor", hint: "Buying to resell" },
      CAFE: { title: "Cafe & Restaurant", hint: "Serving in your own venue" },
    },
    companyName: "Company name",
    taxId: "Tax ID / VAT number",
    taxIdHint: "Optional · any format, e.g. DE811907980",
    country: "Country",
    selectCountry: "Select a country",
    city: "City / State / Province",
    postalCode: "Postal code / ZIP",
    optional: "Optional",
    line1: "Address line 1",
    line1Placeholder: "Street and building number",
    line2: "Address line 2",
    line2Hint: "Optional · apartment, suite, unit",
    customs:
      "International orders are subject to customs clearance and export documentation. Our sales team will contact you regarding wholesale pricing and shipping rates.",
  },
  en: {
    kind: "Account kind",
    kinds: {
      WHOLESALER: { title: "Wholesaler / Distributor", hint: "Buying to resell" },
      CAFE: { title: "Café & Lounge", hint: "Serving in your own venue" },
    },
    companyName: "Company name",
    taxId: "Tax ID / VAT number",
    taxIdHint: "Optional · any format, e.g. DE811907980",
    country: "Country",
    selectCountry: "Select a country",
    city: "City / State / Province",
    postalCode: "Postal code / ZIP",
    optional: "Optional",
    line1: "Address line 1",
    line1Placeholder: "Street and building number",
    line2: "Address line 2",
    line2Hint: "Optional · apartment, suite, unit",
    customs:
      "International orders are subject to customs clearance and export documentation. Our sales team will contact you regarding wholesale pricing and shipping rates.",
  },
  ar: {
    kind: "نوع النشاط",
    kinds: {
      WHOLESALER: { title: "تاجر جملة / موزع", hint: "تشتري لإعادة البيع" },
      CAFE: { title: "مقهى ولاونج", hint: "للتقديم في منشأتك" },
    },
    companyName: "اسم الشركة",
    taxId: "الرقم الضريبي / رقم ضريبة القيمة المضافة",
    taxIdHint: "اختياري · بأي صيغة، مثل 300123456700003",
    country: "الدولة",
    selectCountry: "اختر الدولة",
    city: "المدينة / الولاية / المحافظة",
    postalCode: "الرمز البريدي",
    optional: "اختياري",
    line1: "سطر العنوان 1",
    line1Placeholder: "الشارع ورقم المبنى",
    line2: "سطر العنوان 2",
    line2Hint: "اختياري · شقة، جناح، وحدة",
    customs:
      "تخضع الطلبات الدولية للتخليص الجمركي ومستندات التصدير. سيتواصل معك فريق المبيعات بشأن أسعار الجملة وتكاليف الشحن.",
  },
});

/** Sign-up's own checks (registrationDraft), in the order the fields appear. */
export const registrationProblemMessages = defineMessages({
  tr: {
    domestic: {
      city: (label: string) => `${label} için şehir seçin.`,
      district: (label: string) => `${label} için ilçe girin.`,
      street: (label: string) => `${label} için mahalle/köy veya cadde/sokak girin.`,
      billingAddress: "Fatura adresi",
      corporateAddress: "Kurumsal fatura adresi",
      companyVkn: "Şirket vergi numarası 10 haneli olmalı.",
      taxId: "Vergi numarası 10 (VKN) veya 11 (TC) haneli olmalı.",
      companyTitle: "Firma unvanını girin.",
      platename: "Vergi levhasındaki isim / şirket adını girin.",
      taxOffice: "Vergi dairesini girin.",
      entity: "Şahıs firması mı şirket mi olduğunuzu seçin.",
      contactName: "Yetkili kişinin adı soyadını girin.",
      fullName: "İsim soyisim girin.",
      phone: "Geçerli bir cep telefonu girin.",
      landline: "Sabit telefon numarasını kontrol edin.",
      email: "Geçerli bir e-posta adresi girin.",
      username: "Kullanıcı adı 3-30 karakter olmalı; harf, rakam, nokta, tire ve alt çizgi kullanılabilir.",
      password: (min: number) => `Şifreniz en az ${min} karakter olmalı.`,
      nationalId: "TC kimlik numarası 11 haneli ve geçerli olmalı.",
      invoiceEntity: "Faturanın şahıs firmasına mı şirkete mi kesileceğini seçin.",
    },
    international: {
      companyTitle: "Enter your company name.",
      contactName: "Enter the contact person's name.",
      phone: "Enter a valid mobile number, including the country code.",
      email: "Enter a valid email address.",
      username: "A username is 3-30 characters: letters, numbers, dot, dash or underscore.",
      password: (min: number) => `Your password must be at least ${min} characters.`,
      country: "Select your country.",
      city: "Enter your city, state or province.",
      address: "Enter your address: street and building number.",
    },
  },
  en: {
    domestic: {
      city: (label: string) => `Select a province for the ${label}.`,
      district: (label: string) => `Enter a district for the ${label}.`,
      street: (label: string) => `Enter a neighbourhood/village or a street for the ${label}.`,
      billingAddress: "billing address",
      corporateAddress: "business invoice address",
      companyVkn: "A company's tax number must be 10 digits.",
      taxId: "The tax number must be 10 digits (VKN) or 11 digits (TC).",
      companyTitle: "Enter the business's trade name.",
      platename: "Enter the name / company name on the tax certificate.",
      taxOffice: "Enter the tax office.",
      entity: "Choose whether you are a sole trader or a company.",
      contactName: "Enter the authorised person's full name.",
      fullName: "Enter your full name.",
      phone: "Enter a valid mobile number.",
      landline: "Check the landline number.",
      email: "Enter a valid email address.",
      username: "A username is 3-30 characters: letters, numbers, dot, dash or underscore.",
      password: (min: number) => `Your password must be at least ${min} characters.`,
      nationalId: "The Turkish ID number (TC Kimlik) must be a valid 11-digit number.",
      invoiceEntity: "Choose whether the invoice goes to a sole trader or a company.",
    },
    international: {
      companyTitle: "Enter your company name.",
      contactName: "Enter the contact person's name.",
      phone: "Enter a valid mobile number, including the country code.",
      email: "Enter a valid email address.",
      username: "A username is 3-30 characters: letters, numbers, dot, dash or underscore.",
      password: (min: number) => `Your password must be at least ${min} characters.`,
      country: "Select your country.",
      city: "Enter your city, state or province.",
      address: "Enter your address: street and building number.",
    },
  },
  ar: {
    domestic: {
      city: (label: string) => `اختر المحافظة في ${label}.`,
      district: (label: string) => `أدخل المنطقة في ${label}.`,
      street: (label: string) => `أدخل الحي/القرية أو الشارع في ${label}.`,
      billingAddress: "عنوان الفاتورة",
      corporateAddress: "عنوان فاتورة الشركة",
      companyVkn: "يجب أن يتكوّن الرقم الضريبي للشركة من 10 أرقام.",
      taxId: "يجب أن يتكوّن الرقم الضريبي من 10 أرقام (VKN) أو 11 رقماً (TC).",
      companyTitle: "أدخل الاسم التجاري للمنشأة.",
      platename: "أدخل الاسم / اسم الشركة كما في الشهادة الضريبية.",
      taxOffice: "أدخل مكتب الضرائب.",
      entity: "حدّد ما إذا كنت مؤسسة فردية أم شركة.",
      contactName: "أدخل الاسم الكامل للشخص المسؤول.",
      fullName: "أدخل الاسم الكامل.",
      phone: "أدخل رقم جوال صحيحاً.",
      landline: "تحقّق من رقم الهاتف الأرضي.",
      email: "أدخل بريداً إلكترونياً صحيحاً.",
      username: "يتكوّن اسم المستخدم من 3 إلى 30 حرفاً: أحرف لاتينية وأرقام ونقطة وشرطة وشرطة سفلية.",
      password: (min: number) => `يجب ألا تقل كلمة المرور عن ${min} أحرف.`,
      nationalId: "يجب أن يكون رقم الهوية التركية (TC Kimlik) صحيحاً ومن 11 رقماً.",
      invoiceEntity: "حدّد ما إذا كانت الفاتورة ستصدر باسم مؤسسة فردية أم شركة.",
    },
    international: {
      companyTitle: "أدخل اسم شركتك.",
      contactName: "أدخل اسم الشخص المسؤول.",
      phone: "أدخل رقم جوال صحيحاً مع رمز الدولة.",
      email: "أدخل بريداً إلكترونياً صحيحاً.",
      username: "يتكوّن اسم المستخدم من 3 إلى 30 حرفاً: أحرف لاتينية وأرقام ونقطة وشرطة وشرطة سفلية.",
      password: (min: number) => `يجب ألا تقل كلمة المرور عن ${min} أحرف.`,
      country: "اختر دولتك.",
      city: "أدخل مدينتك أو ولايتك أو محافظتك.",
      address: "أدخل عنوانك: الشارع ورقم المبنى.",
    },
  },
});

/* ------------------------------------------------------------------ B2B application */

export const b2bFieldMessages = defineMessages<{
  segment: string;
  segments: Record<B2BSegment, string>;
  companyTitle: string;
  taxNumber: string;
  taxOffice: string;
  problems: { companyTitle: string; taxNumber: string };
}>({
  tr: {
    segment: "İşletme türü",
    segments: { CAFE: "Kafe / Restoran", WHOLESALE: "Toptancı", DEALER: "Bayi" },
    companyTitle: "Firma unvanı",
    taxNumber: "Vergi no / TCKN",
    taxOffice: "Vergi dairesi",
    problems: {
      companyTitle: "Firma unvanını girin.",
      taxNumber: "Vergi numarası 10 (VKN) veya 11 (TCKN) haneli olmalı.",
    },
  },
  en: {
    segment: "Business type",
    segments: { CAFE: "Café & lounge", WHOLESALE: "Wholesaler", DEALER: "Dealer" },
    companyTitle: "Trade name",
    taxNumber: "Tax number / TC Kimlik",
    taxOffice: "Tax office",
    problems: {
      companyTitle: "Enter the business's trade name.",
      taxNumber: "The tax number must be 10 digits (VKN) or 11 digits (TCKN).",
    },
  },
  ar: {
    segment: "نوع النشاط",
    segments: { CAFE: "مقاهي ولاونج", WHOLESALE: "تاجر جملة", DEALER: "موزع" },
    companyTitle: "الاسم التجاري",
    taxNumber: "الرقم الضريبي / رقم الهوية التركية",
    taxOffice: "مكتب الضرائب",
    problems: {
      companyTitle: "أدخل الاسم التجاري للمنشأة.",
      taxNumber: "يجب أن يتكوّن الرقم الضريبي من 10 أرقام (VKN) أو 11 رقماً (TCKN).",
    },
  },
});

/* ------------------------------------------------------------------ export notice */

/** The export customer's terms (lib/exportAccount): English everywhere but on the Arabic site. */
export const exportNoticeMessages = defineMessages<{
  title: string;
  subtitle: string;
  paragraphs: readonly string[];
  accept: string;
}>({
  tr: {
    title: "Important Notice",
    subtitle: "Export account · wholesale prices · quote on request",
    paragraphs: EXPORT_NOTICE,
    accept: "OK, I understand",
  },
  en: {
    title: "Important Notice",
    subtitle: "Export account · wholesale prices · quote on request",
    paragraphs: EXPORT_NOTICE,
    accept: "OK, I understand",
  },
  ar: {
    title: "تنبيه مهم",
    subtitle: "حساب تصدير · أسعار الجملة · عرض سعر عند الطلب",
    paragraphs: [
      "شاشة الدفع معطّلة لحسابك، ولا يمكن الدفع مباشرة. الأسعار المعروضة على الموقع هي أسعار تصدير بالجملة. يمكنك تجهيز سلتك وإرسال طلب موافقة على الطلبية.",
      "يمكنك في السلة تقديم معلومات عنك، والاستفسار عن تفاصيل المنتجات، وطرح أسئلتك.",
      "بعد الاتفاق، وعند تحديد عدد الطرود والوزن الإجمالي لطلبيتك، يصلك عرض سعر حسب طريقة الشحن التي تختارها، مع مواعيد التسليم المتوقعة.",
    ],
    accept: "حسناً، فهمت",
  },
});

/* ------------------------------------------------------------------ API errors (lib/errors) */

/**
 * Backend `detail` strings the customer can see, by language. The backend
 * writes some in English and some in Turkish; Turkish keeps its own as they
 * are, so its map only has the English ones.
 */
export const apiErrorMessages = defineMessages<{
  known: Record<string, string>;
  insufficientStock: (sku: string, requested: string, available: string) => string;
  notForSale: (sku: string) => string;
  cannotApprove: (status: string) => string;
  variantGone: string;
  unreachable: string;
  checkInput: string;
  serverError: string;
}>({
  tr: {
    known: {
      "Invalid credentials": "E-posta veya şifre hatalı.",
      "Account disabled": "Hesabınız devre dışı bırakılmış. Lütfen bizimle iletişime geçin.",
      "Email already registered": "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
      "Username already taken": "Bu kullanıcı adı alınmış. Lütfen başka bir tane seçin.",
      "Invalid or expired token": "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",
      "Order not found": "Sipariş bulunamadı.",
      "Admin privileges required": "Bu işlem için yönetici yetkisi gerekiyor.",
      "Variant not found": "Ürün varyantı bulunamadı.",
    },
    insufficientStock: (sku, requested, available) =>
      `Stok yetersiz: ${sku} için en fazla ${available} adet sipariş verebilirsiniz (sepette ${requested}).`,
    notForSale: (sku) => `${sku} kodlu ürün hesabınız için satışta değil. Lütfen sepetten çıkarın.`,
    cannotApprove: (status) =>
      `Bu sipariş onaylanamaz: durumu zaten "${status}". Yalnızca onay bekleyen siparişler onaylanabilir.`,
    variantGone: "Sepetinizdeki bir ürün artık satışta değil. Lütfen sepeti güncelleyin.",
    unreachable: "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
    checkInput: "Girdiğiniz bilgileri kontrol edin.",
    serverError: "Sunucuda bir hata oluştu. Lütfen biraz sonra tekrar deneyin.",
  },
  en: {
    known: {
      "Invalid credentials": "Incorrect email or password.",
      "Account disabled": "Your account has been disabled. Please contact us.",
      "Email already registered": "An account with this email address already exists.",
      "Username already taken": "This username is taken. Please choose another one.",
      "Invalid or expired token": "Your session has expired. Please sign in again.",
      "Order not found": "Order not found.",
      "Admin privileges required": "This action needs admin rights.",
      "Variant not found": "Product variant not found.",
      // The backend's Turkish details on the customer's side.
      "Çok fazla hatalı giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.":
        "Too many failed sign-in attempts. Please try again in 15 minutes.",
      "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.": "Too many attempts. Please try again in a little while.",
      "Bağlantı ya da kod geçersiz, kullanılmış veya süresi dolmuş.":
        "The link or code is invalid, has already been used or has expired.",
      "Bu bilgilerle kayıtlı bir hesap varsa şifre yenileme bilgileri gönderildi.":
        "If an account with these details exists, password reset instructions have been sent.",
      "Şifreniz değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.":
        "Your password has been changed. You can sign in with your new password.",
      "Bekleyen bir başvurunuz zaten var": "You already have an application under review.",
    },
    insufficientStock: (sku, requested, available) =>
      `Not enough stock: you can order at most ${available} of ${sku} (${requested} in your cart).`,
    notForSale: (sku) => `Product ${sku} is not available for your account. Please remove it from your cart.`,
    cannotApprove: (status) => `This order can't be approved: its status is already "${status}". Only pending orders can be approved.`,
    variantGone: "A product in your cart is no longer available. Please update your cart.",
    unreachable: "We couldn't reach the server. Check your internet connection and try again.",
    checkInput: "Please check the details you entered.",
    serverError: "Something went wrong on our side. Please try again in a little while.",
  },
  ar: {
    known: {
      "Invalid credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      "Account disabled": "تم إيقاف حسابك. يرجى التواصل معنا.",
      "Email already registered": "يوجد حساب مسجّل بهذا البريد الإلكتروني بالفعل.",
      "Username already taken": "اسم المستخدم هذا مستخدم. يرجى اختيار اسم آخر.",
      "Invalid or expired token": "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.",
      "Order not found": "الطلب غير موجود.",
      "Admin privileges required": "هذا الإجراء يتطلب صلاحيات المسؤول.",
      "Variant not found": "خيار المنتج غير موجود.",
      "Çok fazla hatalı giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.":
        "محاولات تسجيل دخول خاطئة كثيرة. يرجى المحاولة بعد 15 دقيقة.",
      "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.": "محاولات كثيرة. يرجى المحاولة بعد قليل.",
      "Bağlantı ya da kod geçersiz, kullanılmış veya süresi dolmuş.":
        "الرابط أو الرمز غير صالح أو استُخدم من قبل أو انتهت صلاحيته.",
      "Bu bilgilerle kayıtlı bir hesap varsa şifre yenileme bilgileri gönderildi.":
        "إذا كان هناك حساب مسجّل بهذه البيانات، فقد أُرسلت إليه تعليمات إعادة تعيين كلمة المرور.",
      "Şifreniz değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.":
        "تم تغيير كلمة المرور. يمكنك تسجيل الدخول بكلمة المرور الجديدة.",
      "Bekleyen bir başvurunuz zaten var": "لديك طلب قيد المراجعة بالفعل.",
    },
    insufficientStock: (sku, requested, available) =>
      `الكمية غير متوفرة: يمكنك طلب ${available} قطعة كحد أقصى من ${sku} (في السلة ${requested}).`,
    notForSale: (sku) => `المنتج ${sku} غير متاح للبيع لحسابك. يرجى إزالته من السلة.`,
    cannotApprove: (status) => `لا يمكن اعتماد هذا الطلب: حالته بالفعل "${status}". لا يُعتمد إلا الطلب المعلّق.`,
    variantGone: "أحد المنتجات في سلتك لم يعد متاحاً. يرجى تحديث السلة.",
    unreachable: "تعذّر الوصول إلى الخادم. تحقّق من اتصالك بالإنترنت ثم حاول مرة أخرى.",
    checkInput: "يرجى التحقق من البيانات التي أدخلتها.",
    serverError: "حدث خطأ في الخادم. يرجى المحاولة بعد قليل.",
  },
});
