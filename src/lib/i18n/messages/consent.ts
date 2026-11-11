import { defineMessages } from "@/lib/i18n/messages";

/** The cookie banner (components/common/CookieConsentBanner) and the footer's way back to it. */
export const consentMessages = defineMessages({
  tr: {
    title: "Çerez Tercihleri",
    before:
      "Sitemizde temel işlevleri sürdürmek ve alışveriş deneyiminizi iyileştirmek amacıyla yasal mevzuata uygun çerezler kullanılmaktadır. Detaylı bilgi için ",
    policy: "Çerez Politikamızı",
    after: " inceleyebilirsiniz.",
    acceptAll: "Tümünü Kabul Et",
    necessaryOnly: "Yalnızca Gerekli Çerezler",
    preferences: "Çerez Tercihleri",
  },
  en: {
    title: "Cookie Preferences",
    before:
      "We use cookies, in line with the applicable legislation, to keep the site's essential functions running and to improve your shopping experience. For details, please read our ",
    policy: "Cookie Policy",
    after: ".",
    acceptAll: "Accept All",
    necessaryOnly: "Necessary Cookies Only",
    preferences: "Cookie Preferences",
  },
  ar: {
    title: "تفضيلات ملفات تعريف الارتباط",
    before:
      "نستخدم ملفات تعريف الارتباط وفقًا للتشريعات المعمول بها للحفاظ على الوظائف الأساسية للموقع وتحسين تجربة التسوق لديك. لمزيد من التفاصيل يمكنك مراجعة ",
    policy: "سياسة ملفات تعريف الارتباط",
    after: ".",
    acceptAll: "قبول الكل",
    necessaryOnly: "ملفات تعريف الارتباط الضرورية فقط",
    preferences: "تفضيلات ملفات تعريف الارتباط",
  },
});
