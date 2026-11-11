import { defineMessages } from "@/lib/i18n/messages";

/** The cookie banner (components/common/CookieConsentBanner) and the footer's way back to it. */
export const consentMessages = defineMessages({
  tr: {
    title: "Çerez Tercihleri",
    before:
      "Alışverişinizi kolaylaştırmak, size uygun fırsatları öne çıkarmak ve sitemizin nasıl kullanıldığını ölçerek deneyiminizi geliştirmek için yasal mevzuata uygun çerezler kullanıyoruz. Detaylar için ",
    policy: "Çerez Politikamızı",
    after: " inceleyebilirsiniz.",
    acceptAll: "Tümünü Kabul Et",
    necessaryOnly: "Yalnızca Gerekli Çerezler",
    preferences: "Çerez Tercihleri",
  },
  en: {
    title: "Cookie Preferences",
    before:
      "We use cookies, in line with applicable law, to make your shopping easier, bring forward offers that suit you and improve your experience by measuring how our site is used. For details, see our ",
    policy: "Cookie Policy",
    after: ".",
    acceptAll: "Accept All",
    necessaryOnly: "Necessary Cookies Only",
    preferences: "Cookie Preferences",
  },
  ar: {
    title: "تفضيلات ملفات تعريف الارتباط",
    before:
      "نستخدم ملفات تعريف الارتباط وفقًا للتشريعات المعمول بها لتسهيل تسوقك، وإبراز العروض التي تناسبك، وتحسين تجربتك من خلال قياس كيفية استخدام موقعنا. لمزيد من التفاصيل يمكنك مراجعة ",
    policy: "سياسة ملفات تعريف الارتباط",
    after: ".",
    acceptAll: "قبول الكل",
    necessaryOnly: "ملفات تعريف الارتباط الضرورية فقط",
    preferences: "تفضيلات ملفات تعريف الارتباط",
  },
});
