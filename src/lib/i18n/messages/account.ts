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
