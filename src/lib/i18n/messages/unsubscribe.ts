/**
 * "Abonelikten Çık" (/abonelikten-cik): the page a campaign e-mail's footer
 * link opens, which takes the address off campaign e-mail and says so.
 */

import { defineMessages } from "@/lib/i18n/messages";

export const unsubscribeMessages = defineMessages({
  tr: {
    metaTitle: "Abonelikten Çık",
    metaDescription: "Kampanya e-postalarından çıkın.",
    title: "Abonelikten çık",
    subtitle: "Kampanya ve fırsat e-postaları",
    working: "Aboneliğiniz sonlandırılıyor…",
    done: (email: string) => `${email} adresine artık kampanya e-postası gönderilmeyecek.`,
    doneNote:
      "Sipariş ve kargo bildirimleriniz gelmeye devam eder. Fikrinizi değiştirirseniz Hesabım'daki iletişim tercihlerinden yeniden abone olabilirsiniz.",
    invalid:
      "Bu bağlantı geçersiz ya da eksik. E-postadaki bağlantıyı yeniden açmayı deneyin; hesabınızdaki iletişim tercihlerinden de çıkabilirsiniz.",
    failed: "Şu anda işlem yapılamadı. Lütfen birazdan tekrar deneyin.",
    retry: "Tekrar dene",
    account: "İletişim tercihlerim",
    home: "Ana sayfaya dön",
  },
  en: {
    metaTitle: "Unsubscribe",
    metaDescription: "Stop receiving campaign e-mails.",
    title: "Unsubscribe",
    subtitle: "Campaign and deal e-mails",
    working: "Unsubscribing you…",
    done: (email: string) => `${email} will no longer receive campaign e-mails.`,
    doneNote:
      "Order and shipping notifications will still arrive. If you change your mind, you can subscribe again from the communication preferences in My Account.",
    invalid:
      "This link is invalid or incomplete. Try opening the link in the e-mail again, or unsubscribe from the communication preferences in your account.",
    failed: "We couldn't do that right now. Please try again in a moment.",
    retry: "Try again",
    account: "My communication preferences",
    home: "Back to the homepage",
  },
  ar: {
    metaTitle: "إلغاء الاشتراك",
    metaDescription: "أوقف استلام رسائل الحملات عبر البريد الإلكتروني.",
    title: "إلغاء الاشتراك",
    subtitle: "رسائل الحملات والعروض",
    working: "جارٍ إلغاء اشتراكك…",
    done: (email: string) => `لن يتلقى ${email} رسائل الحملات بعد الآن.`,
    doneNote:
      "ستستمر إشعارات الطلبات والشحن في الوصول. إذا غيّرت رأيك، يمكنك الاشتراك مجددًا من تفضيلات التواصل في حسابي.",
    invalid:
      "هذا الرابط غير صالح أو غير مكتمل. حاول فتح الرابط من البريد الإلكتروني مرة أخرى، أو ألغِ الاشتراك من تفضيلات التواصل في حسابك.",
    failed: "تعذّر تنفيذ ذلك الآن. يُرجى المحاولة بعد قليل.",
    retry: "حاول مرة أخرى",
    account: "تفضيلات التواصل",
    home: "العودة إلى الصفحة الرئيسية",
  },
});
