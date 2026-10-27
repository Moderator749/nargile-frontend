/**
 * The words of the shop's own frame: the header's tools and the account menu,
 * the welcome strip, the footer's fixed labels, the error and 404 pages, the
 * UI kit's buttons, the tracking and price-catalog pages' shells and the
 * carriers' names. What the admin writes in "Ana Sayfa Düzenleme" (the
 * footer's columns, the menus) is not here: it is translated with the
 * settings.
 */

import { defineMessages } from "@/lib/i18n/messages";

/** The header, the account menu, the phone's tab bar and the welcome strip. */
export const chromeMessages = defineMessages({
  tr: {
    currencyLabel: "Para birimi (yaklaşık; ödeme TL ile yapılır)",
    currencyTitle: "Fiyatlar TCMB kuruyla yaklaşık gösterilir; ödeme TL ile yapılır.",
    themeToLight: "Açık temaya geç",
    themeToDark: "Koyu temaya geç",
    themeToggle: "Temayı değiştir",
    themeLight: "Açık tema",
    themeDark: "Koyu tema",
    admin: "Yönetim",
    accountMenu: "Hesap menüsü",
    profile: "Hesabım / Profilim",
    orders: "Siparişlerim",
    signOut: "Çıkış Yap",
    withCount: (label: string, n: number) => `${label} (${n} ürün)`,
    welcome: "Sultan Nargile'ye Hoş Geldiniz",
  },
  en: {
    currencyLabel: "Currency (approximate; payment is in TL)",
    currencyTitle: "Prices are approximate, at the Central Bank of Turkey (TCMB) rate; payment is in TL.",
    themeToLight: "Switch to light theme",
    themeToDark: "Switch to dark theme",
    themeToggle: "Change theme",
    themeLight: "Light theme",
    themeDark: "Dark theme",
    admin: "Admin",
    accountMenu: "Account menu",
    profile: "My Account / Profile",
    orders: "My Orders",
    signOut: "Sign Out",
    withCount: (label: string, n: number) => `${label} (${n} ${n === 1 ? "item" : "items"})`,
    welcome: "Welcome to Sultan Nargile",
  },
  ar: {
    currencyLabel: "العملة (تقريبية؛ يتم الدفع بـ TL)",
    currencyTitle: "الأسعار تقريبية حسب سعر صرف البنك المركزي التركي (TCMB)؛ ويتم الدفع بـ TL.",
    themeToLight: "التبديل إلى الوضع الفاتح",
    themeToDark: "التبديل إلى الوضع الداكن",
    themeToggle: "تغيير المظهر",
    themeLight: "الوضع الفاتح",
    themeDark: "الوضع الداكن",
    admin: "لوحة الإدارة",
    accountMenu: "قائمة الحساب",
    profile: "حسابي / الملف الشخصي",
    orders: "طلباتي",
    signOut: "تسجيل الخروج",
    withCount: (label: string, n: number) => `${label} (${n} منتج)`,
    welcome: "أهلاً بكم في SULTAN NARGILE",
  },
});

/** The footer's and the contact cards' own labels; every value beside them is the admin's. */
export const footerMessages = defineMessages({
  tr: {
    homeAria: (brand: string) => `${brand} ana sayfa`,
    hours: "Çalışma Saatleri",
    phone: "Telefon",
    email: "E-Posta",
    whatsapp: "WhatsApp",
    writeNow: "Hemen Yazın",
    kvkk: "KVKK Aydınlatma Metni",
    distanceSales: "Mesafeli Satış Sözleşmesi",
    returns: "İptal & İade Koşulları",
    cookies: "Çerez Politikası",
    payments: "Ödeme yöntemleri",
  },
  en: {
    homeAria: (brand: string) => `${brand} home`,
    hours: "Opening Hours",
    phone: "Phone",
    email: "Email",
    whatsapp: "WhatsApp",
    writeNow: "Message us now",
    kvkk: "Privacy Notice (KVKK)",
    distanceSales: "Distance Sales Agreement",
    returns: "Cancellation & Returns",
    cookies: "Cookie Policy",
    payments: "Payment methods",
  },
  ar: {
    homeAria: (brand: string) => `الصفحة الرئيسية لـ ${brand}`,
    hours: "ساعات العمل",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    whatsapp: "WhatsApp",
    writeNow: "راسلنا الآن",
    kvkk: "إشعار الخصوصية (KVKK)",
    distanceSales: "عقد البيع عن بُعد",
    returns: "الإلغاء والإرجاع",
    cookies: "سياسة ملفات تعريف الارتباط",
    payments: "طرق الدفع",
  },
});

/** The error boundaries' page and the 404. */
export const errorMessages = defineMessages({
  tr: {
    eyebrow: "Geçici bir sorun",
    title: "Sayfa şu anda yüklenemedi",
    body: "Bağlantıda kısa süreli bir sorun yaşadık. Birkaç saniye sonra yeniden deneyebilir ya da alışverişe ana sayfadan devam edebilirsiniz.",
    retry: "Tekrar Dene",
    home: "Ana sayfaya dön",
    code: "Hata kodu:",
    notFoundMeta: "Sayfa bulunamadı",
    notFoundTitle: "Aradığınız sayfa bulunamadı",
    notFoundBody:
      "Bağlantı değişmiş ya da sayfa kaldırılmış olabilir. Aşağıdaki kategorilerden devam edebilir veya kataloğun tamamına göz atabilirsiniz.",
    allProducts: "Tüm ürünler",
    categories: "Kategoriler",
  },
  en: {
    eyebrow: "A temporary problem",
    title: "This page couldn't load right now",
    body: "We had a brief connection problem. Try again in a few seconds, or carry on shopping from the home page.",
    retry: "Try Again",
    home: "Back to home",
    code: "Error code:",
    notFoundMeta: "Page not found",
    notFoundTitle: "We couldn't find the page you're looking for",
    notFoundBody:
      "The link may have changed or the page may have been removed. Carry on from the categories below, or browse the full catalog.",
    allProducts: "All products",
    categories: "Categories",
  },
  ar: {
    eyebrow: "مشكلة مؤقتة",
    title: "تعذّر تحميل الصفحة حالياً",
    body: "واجهنا مشكلة قصيرة في الاتصال. يمكنك المحاولة مجدداً بعد بضع ثوانٍ، أو متابعة التسوق من الصفحة الرئيسية.",
    retry: "حاول مجدداً",
    home: "العودة إلى الصفحة الرئيسية",
    code: "رمز الخطأ:",
    notFoundMeta: "الصفحة غير موجودة",
    notFoundTitle: "لم نعثر على الصفحة التي تبحث عنها",
    notFoundBody: "ربما تغيّر الرابط أو أُزيلت الصفحة. يمكنك المتابعة من الأقسام أدناه أو تصفح الكتالوج كاملاً.",
    allProducts: "جميع المنتجات",
    categories: "الأقسام",
  },
});

/** The UI kit's own buttons. */
export const uiMessages = defineMessages({
  tr: {
    close: "Kapat",
    showPassword: "Şifreyi göster",
    hidePassword: "Şifreyi gizle",
    readMore: "Devamını Oku",
    showLess: "Daha Az Göster",
  },
  en: {
    close: "Close",
    showPassword: "Show password",
    hidePassword: "Hide password",
    readMore: "Read More",
    showLess: "Show Less",
  },
  ar: {
    close: "إغلاق",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    readMore: "اقرأ المزيد",
    showLess: "عرض أقل",
  },
});

/** The pages whose shell is this area's: cargo tracking, the price catalog, the link preview. */
export const pageMessages = defineMessages({
  tr: {
    trackingTitle: "Kargo Takip",
    trackingDescription: "Yurtiçi Kargo takip numaranızla gönderinizi sorgulayın; üyeyseniz siparişlerinizin kargo durumunu görün.",
    priceCatalogTitle: "Fiyat Kataloğu",
    ogTagline: "Nargile takımları, kömür, lüle ve aksesuarlar · Toptan ve perakende",
  },
  en: {
    trackingTitle: "Track Your Order",
    trackingDescription:
      "Track your parcel with its Yurtiçi Kargo tracking number; signed-in customers can also see the shipping status of their orders.",
    priceCatalogTitle: "Price Catalog",
    ogTagline: "Hookah sets, charcoal, bowls and accessories · Wholesale and retail",
  },
  ar: {
    trackingTitle: "تتبع الشحنة",
    trackingDescription: "تتبّع شحنتك برقم تتبع Yurtiçi Kargo، وإذا كان لديك حساب فاطّلع على حالة شحن طلباتك.",
    priceCatalogTitle: "كتالوج الأسعار",
    ogTagline: "شيشة كاملة، فحم، رؤوس شيشة وإكسسوارات · جملة وتجزئة",
  },
});

/** Who carries a parcel, as a customer reads it (lib/tracking). Yurtiçi Kargo is a name and stays one. */
export const carrierMessages = defineMessages({
  tr: { yurtici: "Yurtiçi Kargo", other: "Kargo", own: "Kendi aracımızla" },
  en: { yurtici: "Yurtiçi Kargo", other: "Carrier", own: "By our own vehicle" },
  ar: { yurtici: "Yurtiçi Kargo", other: "شركة الشحن", own: "بسيارتنا الخاصة" },
});
