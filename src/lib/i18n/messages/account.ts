/**
 * "Hesabım": the account page, the business application, communication
 * preferences and the Sultan Puan wallet. "Sultan Puan" and "Sultan Kumbara"
 * are the programme's names and stay as they are.
 */

import { defineMessages } from "@/lib/i18n/messages";
import type { PointSource } from "@/types";

export const accountMessages = defineMessages({
  tr: {
    metaTitle: "Hesabım",
    metaDescription: "Sultan Puan bakiyeniz, yıllık bonus hedefiniz, puan geçmişiniz ve hesap bilgileriniz.",
    title: "Hesabım",
    signInToContinue: "Devam etmek için giriş yapın.",
    signIn: "Giriş yap",
    wallet: "Puan cüzdanı",
    walletFailed: "Puan bilgileri yüklenemedi.",
    orders: "Siparişlerim",
  },
  en: {
    metaTitle: "My Account",
    metaDescription: "Your Sultan Puan balance, annual bonus target, points history and account details.",
    title: "My account",
    signInToContinue: "Sign in to continue.",
    signIn: "Sign in",
    wallet: "Points wallet",
    walletFailed: "We couldn't load your points.",
    orders: "My orders",
  },
  ar: {
    metaTitle: "حسابي",
    metaDescription: "رصيد Sultan Puan، وهدف المكافأة السنوية، وسجل النقاط، وبيانات حسابك.",
    title: "حسابي",
    signInToContinue: "سجّل الدخول للمتابعة.",
    signIn: "تسجيل الدخول",
    wallet: "محفظة النقاط",
    walletFailed: "تعذّر تحميل بيانات النقاط.",
    orders: "طلباتي",
  },
});

export const b2bPanelMessages = defineMessages({
  tr: {
    heading: "İşletme hesabı",
    pending: (segment: string, company: string, date: string) =>
      `${segment} başvurunuz (${company}) ${date} tarihinden beri inceleniyor. Onaylanınca size özel fiyatlar otomatik uygulanır.`,
    approved: "Başvurunuz onaylandı; işletme fiyatları hesabınızda tanımlı.",
    rejected: (note: string | null | undefined) => `Önceki başvurunuz onaylanmadı${note ? `: ${note}` : "."}`,
    invite: "Kafe, toptancı veya bayi misiniz? Size özel fiyatlar için başvurun.",
    apply: "Başvur",
    submit: "Başvuruyu gönder",
    failed: "Başvuru gönderilemedi.",
  },
  en: {
    heading: "Business account",
    pending: (segment: string, company: string, date: string) =>
      `Your ${segment} application (${company}) has been under review since ${date}. Once it is approved, your prices apply automatically.`,
    approved: "Your application was approved; business prices are set on your account.",
    rejected: (note: string | null | undefined) => `Your previous application was not approved${note ? `: ${note}` : "."}`,
    invite: "Are you a café, wholesaler or dealer? Apply for the prices set for businesses like yours.",
    apply: "Apply",
    submit: "Send application",
    failed: "We couldn't send your application.",
  },
  ar: {
    heading: "حساب الشركات",
    pending: (segment: string, company: string, date: string) =>
      `طلبك كـ${segment} (${company}) قيد المراجعة منذ ${date}. بعد الموافقة تُطبَّق الأسعار الخاصة بك تلقائياً.`,
    approved: "تمت الموافقة على طلبك؛ أسعار الشركات مفعّلة في حسابك.",
    rejected: (note: string | null | undefined) => `لم تتم الموافقة على طلبك السابق${note ? `: ${note}` : "."}`,
    invite: "هل لديك مقهى أو تجارة جملة أو توزيع؟ قدّم طلبك لتحصل على أسعار خاصة.",
    apply: "قدّم طلباً",
    submit: "إرسال الطلب",
    failed: "تعذّر إرسال الطلب.",
  },
});

export const communicationMessages = defineMessages({
  tr: {
    heading: "İletişim tercihleri",
    intro:
      "Kampanya iletilerini ne zaman isterseniz açıp kapatabilirsiniz. Sipariş ve şifre bildirimleri her durumda gönderilir.",
    email: { title: "Kampanya e-postaları", hint: "Yeni ürünler, indirimler ve kampanyalar e-postanıza gelsin." },
    sms: { title: "Kampanya SMS'leri", hint: "Kampanya ve fırsatlar cep telefonunuza SMS olarak gelsin." },
    loadFailed: "İletişim tercihleri yüklenemedi.",
    saveFailed: "Tercih kaydedilemedi.",
    saved: "Tercihiniz kaydedildi.",
  },
  en: {
    heading: "Communication preferences",
    intro:
      "Turn campaign messages on or off whenever you like. Order and password notifications are always sent.",
    email: { title: "Campaign emails", hint: "Get new products, discounts and campaigns by email." },
    sms: { title: "Campaign SMS", hint: "Get campaigns and offers by SMS on your mobile phone." },
    loadFailed: "We couldn't load your communication preferences.",
    saveFailed: "We couldn't save your preference.",
    saved: "Your preference has been saved.",
  },
  ar: {
    heading: "تفضيلات التواصل",
    intro: "يمكنك تفعيل رسائل الحملات أو إيقافها متى شئت. تُرسَل إشعارات الطلبات وكلمة المرور في جميع الأحوال.",
    email: { title: "رسائل الحملات بالبريد الإلكتروني", hint: "تصلك المنتجات الجديدة والخصومات والحملات على بريدك الإلكتروني." },
    sms: { title: "رسائل الحملات SMS", hint: "تصلك الحملات والعروض برسالة SMS على جوالك." },
    loadFailed: "تعذّر تحميل تفضيلات التواصل.",
    saveFailed: "تعذّر حفظ اختيارك.",
    saved: "تم حفظ اختيارك.",
  },
});

export const walletMessages = defineMessages<{
  sources: Record<PointSource, string>;
  /** The ledger's old names ("ParaPuan", "Kumbarapuanı") read as today's. */
  bonusName: string;
  kumbaraEyebrow: string;
  kumbaraTitle: string;
  kumbaraBadge: string;
  progressLabel: string;
  sinceBonus: (date: string) => string;
  lastDays: (days: number) => string;
  /** The text either side of the amount still to go, which is set in bold. */
  spentLine: (since: string, spent: string, target: string) => [before: string, after: string];
  bonusLine: (points: string) => string;
  ceiling: (amount: string) => string;
  allOrders: string;
  available: string;
  discount: (amount: string) => string;
  pointEquals: string;
  disabled: string;
  expiringSoon: (points: string) => string;
  validity: string;
  lots: string;
  point: string;
  points: string;
  lastDay: (date: string) => string;
  noExpiry: string;
  history: string;
  noHistory: string;
  voided: string;
}>({
  tr: {
    sources: {
      PARAPUAN: "Sultan Puan",
      KUMBARA: "Yıllık Sultan Puan bonusu",
      CHECKOUT: "Sepette kullanıldı",
      ADMIN: "Düzeltme",
    },
    bonusName: "Yıllık Sultan Puan bonusu",
    kumbaraEyebrow: "Sultan Kumbara",
    kumbaraTitle: "Sadakatiniz Kazandırıyor",
    kumbaraBadge: "Sultan Ailesine Özel Yıllık Birikim",
    progressLabel: "Yıllık sadakat hedefine ilerleme",
    sinceBonus: (date) => `${date} tarihli bonusunuzdan bu yana`,
    lastDays: (days) => `Son ${days} günde`,
    spentLine: (since, spent, target) => [`${since} ${spent} harcadınız, ${target} hedefine `, " kaldı!"],
    bonusLine: (points) => `Hedefe ulaştığınızda ${points} Sultan Puan bonus kazanırsınız.`,
    ceiling: (amount) => `${amount} altındaki ödenmiş siparişleriniz sayılır.`,
    allOrders: "Ödenmiş tüm siparişleriniz sayılır.",
    available: "Kullanılabilir Sultan Puan",
    discount: (amount) => `= ${amount} indirim`,
    pointEquals: "1 puan =",
    disabled: "Sultan Puan programı şu anda kapalı; bakiyeniz korunuyor.",
    expiringSoon: (points) => `${points} puan 30 gün içinde sona eriyor.`,
    validity: "Puanlarınız kazanıldıkları tarihten itibaren 1 yıl geçerlidir ve sepette kargo hariç tutara uygulanır.",
    lots: "Geçerlilik",
    point: "Puan",
    points: "puan",
    lastDay: (date) => `Son gün: ${date}`,
    noExpiry: "Süresiz",
    history: "Puan geçmişi",
    noHistory: "Henüz puan hareketi yok.",
    voided: "sipariş iptal edildi, puanlar iade edildi",
  },
  en: {
    sources: {
      PARAPUAN: "Sultan Puan",
      KUMBARA: "Annual Sultan Puan bonus",
      CHECKOUT: "Used at checkout",
      ADMIN: "Adjustment",
    },
    bonusName: "Annual Sultan Puan bonus",
    kumbaraEyebrow: "Sultan Kumbara",
    kumbaraTitle: "Your Loyalty Pays Off",
    kumbaraBadge: "Annual savings, exclusive to the Sultan family",
    progressLabel: "Progress towards your annual loyalty target",
    sinceBonus: (date) => `Since your bonus of ${date}`,
    lastDays: (days) => `In the last ${days} days`,
    spentLine: (since, spent, target) => [`${since} you have spent ${spent}: `, ` to go to your ${target} target!`],
    bonusLine: (points) => `Reach the target and earn a ${points} Sultan Puan bonus.`,
    ceiling: (amount) => `Paid orders under ${amount} count.`,
    allOrders: "All your paid orders count.",
    available: "Available Sultan Puan",
    discount: (amount) => `= ${amount} off`,
    pointEquals: "1 point =",
    disabled: "The Sultan Puan programme is paused at the moment; your balance is kept.",
    expiringSoon: (points) => `${points} points expire within 30 days.`,
    validity: "Your points are valid for 1 year from the day you earn them and apply to your cart total excluding shipping.",
    lots: "Validity",
    point: "Points",
    points: "points",
    lastDay: (date) => `Expires: ${date}`,
    noExpiry: "No expiry",
    history: "Points history",
    noHistory: "No points activity yet.",
    voided: "order cancelled, points returned",
  },
  ar: {
    sources: {
      PARAPUAN: "Sultan Puan",
      KUMBARA: "مكافأة Sultan Puan السنوية",
      CHECKOUT: "استُخدمت في السلة",
      ADMIN: "تعديل",
    },
    bonusName: "مكافأة Sultan Puan السنوية",
    kumbaraEyebrow: "Sultan Kumbara",
    kumbaraTitle: "ولاؤك يُكافأ",
    kumbaraBadge: "مدخرات سنوية حصرية لعائلة Sultan",
    progressLabel: "التقدّم نحو هدف الولاء السنوي",
    sinceBonus: (date) => `منذ مكافأتك بتاريخ ${date}`,
    lastDays: (days) => `خلال آخر ${days} يوماً`,
    spentLine: (since, spent, target) => [`${since} أنفقت ${spent}، ويتبقى `, ` لبلوغ هدف ${target}!`],
    bonusLine: (points) => `عند بلوغ الهدف تكسب مكافأة ${points} Sultan Puan.`,
    ceiling: (amount) => `تُحتسب طلباتك المدفوعة التي تقل عن ${amount}.`,
    allOrders: "تُحتسب جميع طلباتك المدفوعة.",
    available: "رصيد Sultan Puan المتاح",
    discount: (amount) => `= خصم ${amount}`,
    pointEquals: "1 نقطة =",
    disabled: "برنامج Sultan Puan متوقف حالياً؛ رصيدك محفوظ.",
    expiringSoon: (points) => `${points} نقطة تنتهي صلاحيتها خلال 30 يوماً.`,
    validity: "نقاطك صالحة لمدة سنة من تاريخ كسبها، وتُطبَّق على مبلغ السلة دون تكلفة الشحن.",
    lots: "الصلاحية",
    point: "نقاط",
    points: "نقطة",
    lastDay: (date) => `آخر يوم: ${date}`,
    noExpiry: "بلا انتهاء",
    history: "سجل النقاط",
    noHistory: "لا توجد حركة نقاط بعد.",
    voided: "أُلغي الطلب وأُعيدت النقاط",
  },
});

/** "Hesap bilgilerim": the name and number orders go out under. */
export const profileMessages = defineMessages({
  tr: {
    heading: "Hesap bilgilerim",
    intro: "Siparişleriniz bu ad ve telefonla gönderilir. Telefonunuz kargo, sipariş bildirimleri ve SMS ile şifre yenileme için kullanılır.",
    firstName: "Ad",
    lastName: "Soyad",
    phone: "Telefon",
    phonePlaceholder: "05xx xxx xx xx",
    email: "E-posta",
    emailNote: "E-posta adresiniz giriş bilginizdir; değiştirmek için bize ulaşın.",
    save: "Kaydet",
    saved: "Bilgileriniz kaydedildi.",
    saveFailed: "Bilgileriniz kaydedilemedi.",
    nameProblem: "Adınızı ve soyadınızı girin.",
    phoneProblem: "Geçerli bir telefon numarası girin.",
  },
  en: {
    heading: "My details",
    intro: "Your orders go out under this name and number. Your phone is used for delivery, order updates and resetting your password by SMS.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    phonePlaceholder: "05xx xxx xx xx",
    email: "Email",
    emailNote: "Your email address is how you sign in; contact us to change it.",
    save: "Save",
    saved: "Your details were saved.",
    saveFailed: "We couldn't save your details.",
    nameProblem: "Enter your first and last name.",
    phoneProblem: "Enter a valid phone number.",
  },
  ar: {
    heading: "بياناتي",
    intro: "تُرسل طلباتك بهذا الاسم والرقم. يُستخدم هاتفك للشحن وإشعارات الطلب وإعادة تعيين كلمة المرور عبر الرسائل النصية.",
    firstName: "الاسم",
    lastName: "اسم العائلة",
    phone: "الهاتف",
    phonePlaceholder: "05xx xxx xx xx",
    email: "البريد الإلكتروني",
    emailNote: "بريدك الإلكتروني هو بيانات دخولك؛ تواصل معنا لتغييره.",
    save: "حفظ",
    saved: "تم حفظ بياناتك.",
    saveFailed: "تعذّر حفظ بياناتك.",
    nameProblem: "أدخل اسمك واسم عائلتك.",
    phoneProblem: "أدخل رقم هاتف صحيحًا.",
  },
});

/** "Şifre değiştir". */
export const passwordMessages = defineMessages({
  tr: {
    heading: "Şifre değiştir",
    intro: "Şifreniz değişince diğer cihazlardaki oturumlarınız kapanır.",
    current: "Mevcut şifre",
    next: "Yeni şifre",
    repeat: "Yeni şifre (tekrar)",
    minimum: (n: number) => `En az ${n} karakter.`,
    tooShort: (n: number) => `Yeni şifre en az ${n} karakter olmalı.`,
    mismatch: "Yeni şifreler aynı değil.",
    missingCurrent: "Mevcut şifrenizi girin.",
    save: "Şifreyi değiştir",
    saved: "Şifreniz değiştirildi.",
    saveFailed: "Şifreniz değiştirilemedi.",
  },
  en: {
    heading: "Change password",
    intro: "Changing your password signs you out on your other devices.",
    current: "Current password",
    next: "New password",
    repeat: "New password (again)",
    minimum: (n: number) => `At least ${n} characters.`,
    tooShort: (n: number) => `The new password must be at least ${n} characters.`,
    mismatch: "The new passwords don't match.",
    missingCurrent: "Enter your current password.",
    save: "Change password",
    saved: "Your password was changed.",
    saveFailed: "We couldn't change your password.",
  },
  ar: {
    heading: "تغيير كلمة المرور",
    intro: "عند تغيير كلمة المرور يتم تسجيل خروجك من أجهزتك الأخرى.",
    current: "كلمة المرور الحالية",
    next: "كلمة المرور الجديدة",
    repeat: "كلمة المرور الجديدة (مرة أخرى)",
    minimum: (n: number) => `${n} أحرف على الأقل.`,
    tooShort: (n: number) => `يجب أن تتكون كلمة المرور الجديدة من ${n} أحرف على الأقل.`,
    mismatch: "كلمتا المرور الجديدتان غير متطابقتين.",
    missingCurrent: "أدخل كلمة المرور الحالية.",
    save: "تغيير كلمة المرور",
    saved: "تم تغيير كلمة المرور.",
    saveFailed: "تعذّر تغيير كلمة المرور.",
  },
});

/** "Adreslerim": the invoice address and the saved delivery addresses. */
export const addressBookMessages = defineMessages({
  tr: {
    heading: "Adreslerim",
    billingTitle: "Fatura adresi",
    corporateTitle: "Kurumsal fatura adresi",
    intro: "Kayıtlı adresleriniz sepette teslimat seçeneği olarak çıkar.",
    firmIntro: "Siparişleriniz kayıtlı firma adresinize gönderilir; sepette şube adresi de girebilirsiniz.",
    loadFailed: "Adresleriniz yüklenemedi.",
    empty: "Kayıtlı adresiniz yok.",
    add: "Yeni adres ekle",
    edit: "Düzenle",
    remove: "Sil",
    confirmRemove: (label: string) => `"${label}" adresi silinsin mi?`,
    invoiceNote: "Fatura adresi silinemez.",
    corporateNote: "Firma fatura bilgileri sepette düzenlenir.",
    registeredNote: "Kayıtlı firma adresi; değiştirmek için bize ulaşın.",
    label: "Adres başlığı",
    labelPlaceholder: "Ev, İş…",
    country: "Ülke",
    city: "İl",
    citySelect: "İl seçin",
    district: "İlçe",
    postal: "Posta kodu",
    line: "Açık adres",
    linePlaceholder: "Mahalle, cadde/sokak, bina ve daire no",
    save: "Kaydet",
    cancel: "Vazgeç",
    saved: "Adres kaydedildi.",
    removed: "Adres silindi.",
    saveFailed: "Adres kaydedilemedi.",
    removeFailed: "Adres silinemedi.",
    limit: (n: number) => `En fazla ${n} teslimat adresi kaydedebilirsiniz.`,
    problems: {
      city: "İl seçin.",
      district: "İlçe girin.",
      line: "Açık adresi girin (en az 5 karakter).",
      country: "Ülke seçin.",
      cityAbroad: "Şehri girin.",
    },
  },
  en: {
    heading: "My addresses",
    billingTitle: "Invoice address",
    corporateTitle: "Business invoice address",
    intro: "Your saved addresses appear as delivery options in your cart.",
    firmIntro: "Your orders go to your registered business address; you can also enter a branch address in your cart.",
    loadFailed: "We couldn't load your addresses.",
    empty: "You have no saved addresses.",
    add: "Add a new address",
    edit: "Edit",
    remove: "Delete",
    confirmRemove: (label: string) => `Delete the address "${label}"?`,
    invoiceNote: "The invoice address can't be deleted.",
    corporateNote: "Business invoice details are edited in your cart.",
    registeredNote: "Registered business address; contact us to change it.",
    label: "Address name",
    labelPlaceholder: "Home, Work…",
    country: "Country",
    city: "Province",
    citySelect: "Select a province",
    district: "District",
    postal: "Postal code",
    line: "Address",
    linePlaceholder: "Neighbourhood, street, building and flat number",
    save: "Save",
    cancel: "Cancel",
    saved: "The address was saved.",
    removed: "The address was deleted.",
    saveFailed: "We couldn't save the address.",
    removeFailed: "We couldn't delete the address.",
    limit: (n: number) => `You can save up to ${n} delivery addresses.`,
    problems: {
      city: "Select a province.",
      district: "Enter the district.",
      line: "Enter the address (at least 5 characters).",
      country: "Select a country.",
      cityAbroad: "Enter the city.",
    },
  },
  ar: {
    heading: "عناويني",
    billingTitle: "عنوان الفاتورة",
    corporateTitle: "عنوان فاتورة الشركة",
    intro: "تظهر عناوينك المحفوظة كخيارات للتسليم في سلة التسوق.",
    firmIntro: "تُرسل طلباتك إلى عنوان شركتك المسجّل؛ ويمكنك أيضًا إدخال عنوان فرع في سلة التسوق.",
    loadFailed: "تعذّر تحميل عناوينك.",
    empty: "لا توجد عناوين محفوظة.",
    add: "إضافة عنوان جديد",
    edit: "تعديل",
    remove: "حذف",
    confirmRemove: (label: string) => `هل تريد حذف العنوان "${label}"؟`,
    invoiceNote: "لا يمكن حذف عنوان الفاتورة.",
    corporateNote: "تُعدَّل بيانات فاتورة الشركة في سلة التسوق.",
    registeredNote: "عنوان الشركة المسجّل؛ تواصل معنا لتغييره.",
    label: "اسم العنوان",
    labelPlaceholder: "المنزل، العمل…",
    country: "الدولة",
    city: "المحافظة",
    citySelect: "اختر المحافظة",
    district: "المنطقة",
    postal: "الرمز البريدي",
    line: "العنوان",
    linePlaceholder: "الحي، الشارع، رقم المبنى والشقة",
    save: "حفظ",
    cancel: "إلغاء",
    saved: "تم حفظ العنوان.",
    removed: "تم حذف العنوان.",
    saveFailed: "تعذّر حفظ العنوان.",
    removeFailed: "تعذّر حذف العنوان.",
    limit: (n: number) => `يمكنك حفظ ${n} عناوين تسليم كحد أقصى.`,
    problems: {
      city: "اختر المحافظة.",
      district: "أدخل المنطقة.",
      line: "أدخل العنوان (5 أحرف على الأقل).",
      country: "اختر الدولة.",
      cityAbroad: "أدخل المدينة.",
    },
  },
});

/** The one-time card asking for campaign consent (ticari elektronik ileti onayı). */
export const consentPromptMessages = defineMessages({
  tr: {
    heading: "Kampanyalardan haberdar olmak ister misiniz?",
    intro: "Yeni ürünler, indirimler ve size özel fırsatlar için size ulaşabilmemize izin verin. Tamamen isteğe bağlıdır; Hesabım sayfasından istediğiniz zaman kapatabilirsiniz.",
    email: "E-posta ile",
    sms: "SMS ile",
    save: "Tercihimi kaydet",
    notNow: "Şimdi değil",
    thanks: "Teşekkürler, tercihiniz kaydedildi.",
    failed: "Tercihiniz kaydedilemedi. Lütfen tekrar deneyin.",
  },
  en: {
    heading: "Would you like to hear about our campaigns?",
    intro: "Let us reach you about new products, discounts and offers for you. It's entirely optional, and you can turn it off any time on your account page.",
    email: "By email",
    sms: "By SMS",
    save: "Save my choice",
    notNow: "Not now",
    thanks: "Thank you, your choice was saved.",
    failed: "We couldn't save your choice. Please try again.",
  },
  ar: {
    heading: "هل ترغب في معرفة حملاتنا؟",
    intro: "اسمح لنا بالتواصل معك بشأن المنتجات الجديدة والخصومات والعروض الخاصة بك. هذا اختياري تمامًا، ويمكنك إيقافه في أي وقت من صفحة حسابك.",
    email: "عبر البريد الإلكتروني",
    sms: "عبر الرسائل النصية",
    save: "حفظ اختياري",
    notNow: "ليس الآن",
    thanks: "شكرًا، تم حفظ اختيارك.",
    failed: "تعذّر حفظ اختيارك. يرجى المحاولة مرة أخرى.",
  },
});
