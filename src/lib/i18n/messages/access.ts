/** "Grup Erişim Kısıtlamaları": the notice a closed page, category, brand or product shows. */

import { defineMessages } from "@/lib/i18n/messages";

export const accessMessages = defineMessages({
  tr: {
    meta: "Erişim kısıtlı",
    eyebrow: "Erişim kısıtlı",
    title: "Bu sayfa veya ürün grubu hesap türünüz için görüntülemeye kapalıdır",
    body: "Bu içerik hesabınızın müşteri grubuna açık değil. Bir yanlışlık olduğunu düşünüyorsanız bizimle iletişime geçin.",
    home: "Ana sayfaya dön",
    signIn: "Giriş yap",
  },
  en: {
    meta: "Access restricted",
    eyebrow: "Access restricted",
    title: "This page or product group is not available to your account type",
    body: "This content is not open to your account's customer group. If you think this is a mistake, please contact us.",
    home: "Back to home",
    signIn: "Sign in",
  },
  ar: {
    meta: "الوصول مقيد",
    eyebrow: "الوصول مقيد",
    title: "هذه الصفحة أو مجموعة المنتجات غير متاحة لنوع حسابك",
    body: "هذا المحتوى غير متاح لفئة العملاء التي ينتمي إليها حسابك. إذا كنت تعتقد أن هناك خطأ، يرجى التواصل معنا.",
    home: "العودة إلى الصفحة الرئيسية",
    signIn: "تسجيل الدخول",
  },
});
