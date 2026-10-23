/**
 * The storefront's own words in Turkish, English and Arabic.
 *
 * Turkish is the source and gives the shape: English and Arabic must have every
 * key, so a missing word is a type error, never a blank on the page. The
 * vocabulary is the trade's, as people search for it — "hookah bowl", "heat
 * management device", "رأس شيشة" — not a word-for-word rendering.
 *
 * The catalog's own text (product names and descriptions, category names) is
 * not here: the API answers in the page's language (app/services/localize.py
 * in the backend), from translations stored with each product.
 */

import type { Locale } from "@/lib/i18n/config";

const tr = {
  meta: {
    siteTitle: "Nargile Malzemesi — Endüstriyel Toptan & Perakende Nargile Çözümleri",
    defaultDescription:
      "Nargile Malzemesi: endüstriyel nargile takımları, kömür, lüle ve aksesuarlar. Kafe, toptancı ve bayilere özel fiyatlar, 3.000 TL üzeri ücretsiz kargo, İstanbul içi kurye.",
    shopPromise: "Kafe, toptancı ve bayilere özel fiyatlar, 3.000 TL üzeri ücretsiz kargo.",
    genuine: "Orijinal ürünler, güvenli ödeme.",
    categoryTitle: (name: string) => `${name} Modelleri ve Fiyatları`,
    categoryLead: (name: string, brands: string[]) =>
      brands.length > 0 ? `${name}: ${brands.join(", ")} ve daha fazlası.` : `${name} modelleri ve fiyatları.`,
    brandTitle: (brand: string) => `${brand} Nargile Ürünleri ve Fiyatları`,
    brandLead: (brand: string, sample: string[], count: number) =>
      count > 0
        ? `${brand} nargile ürünleri${sample.length ? `: ${sample.join(", ")}` : ""} ve tüm ${brand} modelleri.`
        : `${brand} ürünleri.`,
    brandGenuine: (brand: string) => `Orijinal ${brand}, güvenli ödeme.`,
    catalogTitle: "Tüm Ürünler — Nargile Takımları, Lüle, Kömür ve Aksesuarlar",
    catalogDescription:
      "Nargile takımları, lüleler, nargile kömürü, közlükler, marpuçlar ve aksesuarlar: tüm ürünler tek sayfada. Kafe, toptancı ve bayilere özel fiyatlar.",
    dealsTitle: "Fırsat Ürünleri — İndirimli Nargile Takımları",
    dealsDescription: "Nargile takımları, aksesuarlar ve kömürde süreli fırsatlar: indirimli fiyatlar, stoklarla sınırlı kampanyalar.",
    productNotFound: "Ürün bulunamadı",
    categoryNotFound: "Kategori bulunamadı",
    brandNotFound: "Marka bulunamadı",
    catalogHeading: "Endüstriyel Nargile & Toptan Çözümler",
    catalogPageTitle: "Katalog — Endüstriyel Nargile & Toptan Çözümler",
    brandHeading: (brand: string) => `${brand} Ürünleri`,
  },
  nav: {
    searchPlaceholder: "Ürün, marka veya kod ara",
    searchLabel: "Ürün ara",
    signIn: "Giriş Yap",
    tracking: "Kargo Takip",
    categories: "Kategoriler",
    home: "Ana Sayfa",
    cart: "Sepetim",
    cartWithCount: (n: number) => `Sepet (${n} ürün)`,
    account: "Hesabım",
    language: "Dil",
    continueShopping: "Alışverişe Devam Et",
    close: "Kapat",
    mainMenu: "Ana menü",
    mobileMenu: "Mobil menü",
    homeAria: "Nargile Malzemesi ana sayfa",
    openColumn: "Kategori sütununu aç",
    closeColumn: "Kategori sütununu kapat",
    categoryKinds: "Kategoriler",
    backToShop: "Alışverişe dön",
    catalog: "Katalog",
    deals: "Fırsat Ürünleri",
    search: "Ara",
    searchSuggestions: "Arama önerileri",
    searchProducts: "Ürünler",
    searchCategories: "Kategoriler",
    searchAll: (n: number) => `Tüm sonuçları gör (${n.toLocaleString("tr-TR")})`,
    searchNone: "Eşleşen ürün bulunamadı",
  },
};

export type Dictionary = typeof tr;

const en: Dictionary = {
  meta: {
    siteTitle: "Nargile Malzemesi — Hookah Sets, Bowls, Charcoal & Accessories | Wholesale & Retail",
    defaultDescription:
      "Hookah sets, hookah bowls, natural coconut hookah charcoal, heat management devices and accessories from Istanbul. Wholesale prices for cafés, lounges and dealers.",
    shopPromise: "Wholesale prices for cafés, lounges and dealers; shipped from Istanbul.",
    genuine: "Genuine products, secure payment.",
    categoryTitle: (name: string) => `${name} — Models & Prices`,
    categoryLead: (name: string, brands: string[]) =>
      brands.length > 0 ? `${name}: ${brands.join(", ")} and more.` : `${name}: models and prices.`,
    brandTitle: (brand: string) => `${brand} Hookahs & Accessories — Prices`,
    brandLead: (brand: string, sample: string[], count: number) =>
      count > 0
        ? `${brand} hookah products${sample.length ? `: ${sample.join(", ")}` : ""} and every ${brand} model.`
        : `${brand} products.`,
    brandGenuine: (brand: string) => `Genuine ${brand}, secure payment.`,
    catalogTitle: "All Products — Hookah Sets, Bowls, Charcoal & Accessories",
    catalogDescription:
      "Hookah sets, hookah bowls, coconut hookah charcoal, heat management devices, hoses and accessories in one place. Wholesale prices for cafés, lounges and dealers.",
    dealsTitle: "Hookah Deals — Discounted Hookah Sets",
    dealsDescription: "Limited-stock deals on hookah sets and accessories. Grab them before the offer ends.",
    productNotFound: "Product not found",
    categoryNotFound: "Category not found",
    brandNotFound: "Brand not found",
    catalogHeading: "Hookah Supplies — Wholesale & Retail",
    catalogPageTitle: "Catalog — Hookah Sets, Bowls, Charcoal & Accessories",
    brandHeading: (brand: string) => `${brand} Products`,
  },
  nav: {
    searchPlaceholder: "Search products, brands or codes",
    searchLabel: "Search products",
    signIn: "Sign In",
    tracking: "Track Order",
    categories: "Categories",
    home: "Home",
    cart: "Cart",
    cartWithCount: (n: number) => `Cart (${n} ${n === 1 ? "item" : "items"})`,
    account: "My Account",
    language: "Language",
    continueShopping: "Continue Shopping",
    close: "Close",
    mainMenu: "Main menu",
    mobileMenu: "Mobile menu",
    homeAria: "Nargile Malzemesi home",
    openColumn: "Open the category column",
    closeColumn: "Close the category column",
    categoryKinds: "Categories",
    backToShop: "Back to shopping",
    catalog: "Catalog",
    deals: "Deals",
    search: "Search",
    searchSuggestions: "Search suggestions",
    searchProducts: "Products",
    searchCategories: "Categories",
    searchAll: (n: number) => `See all results (${n.toLocaleString("en-GB")})`,
    searchNone: "No matching products",
  },
};

const ar: Dictionary = {
  meta: {
    siteTitle: "Nargile Malzemesi — شيشة كاملة، رؤوس شيشة، فحم وإكسسوارات | جملة وتجزئة",
    defaultDescription:
      "شيشة كاملة، رؤوس شيشة، فحم جوز الهند الطبيعي، منظمات حرارة وإكسسوارات من إسطنبول. أسعار جملة للمقاهي والموزعين.",
    shopPromise: "أسعار جملة للمقاهي والموزعين؛ شحن من إسطنبول.",
    genuine: "منتجات أصلية ودفع آمن.",
    categoryTitle: (name: string) => `${name} — الموديلات والأسعار`,
    categoryLead: (name: string, brands: string[]) =>
      brands.length > 0 ? `${name}: ${brands.join("، ")} والمزيد.` : `${name}: الموديلات والأسعار.`,
    brandTitle: (brand: string) => `شيشة وإكسسوارات ${brand} — الأسعار`,
    brandLead: (brand: string, sample: string[], count: number) =>
      count > 0
        ? `منتجات شيشة ${brand}${sample.length ? `: ${sample.join("، ")}` : ""} وجميع موديلات ${brand}.`
        : `منتجات ${brand}.`,
    brandGenuine: (brand: string) => `${brand} أصلي، ودفع آمن.`,
    catalogTitle: "جميع المنتجات — شيشة كاملة، رؤوس، فحم وإكسسوارات",
    catalogDescription:
      "شيشة كاملة، رؤوس شيشة، فحم جوز الهند، منظمات حرارة، ليّ شيشة وإكسسوارات في مكان واحد. أسعار جملة للمقاهي والموزعين.",
    dealsTitle: "عروض الشيشة — أطقم شيشة مخفضة",
    dealsDescription: "عروض بكميات محدودة على أطقم الشيشة والإكسسوارات. اغتنمها قبل انتهاء العرض.",
    productNotFound: "المنتج غير موجود",
    categoryNotFound: "القسم غير موجود",
    brandNotFound: "الماركة غير موجودة",
    catalogHeading: "مستلزمات الشيشة — جملة وتجزئة",
    catalogPageTitle: "الكتالوج — شيشة كاملة، رؤوس، فحم وإكسسوارات",
    brandHeading: (brand: string) => `منتجات ${brand}`,
  },
  nav: {
    searchPlaceholder: "ابحث عن منتج أو ماركة أو كود",
    searchLabel: "ابحث عن منتج",
    signIn: "تسجيل الدخول",
    tracking: "تتبع الشحنة",
    categories: "الأقسام",
    home: "الرئيسية",
    cart: "السلة",
    cartWithCount: (n: number) => `السلة (${n} منتج)`,
    account: "حسابي",
    language: "اللغة",
    continueShopping: "متابعة التسوق",
    close: "إغلاق",
    mainMenu: "القائمة الرئيسية",
    mobileMenu: "قائمة الجوال",
    homeAria: "الصفحة الرئيسية لـ Nargile Malzemesi",
    openColumn: "افتح عمود الأقسام",
    closeColumn: "أغلق عمود الأقسام",
    categoryKinds: "الأقسام",
    backToShop: "العودة إلى التسوق",
    catalog: "الكتالوج",
    deals: "العروض",
    search: "بحث",
    searchSuggestions: "اقتراحات البحث",
    searchProducts: "المنتجات",
    searchCategories: "الأقسام",
    searchAll: (n: number) => `عرض كل النتائج (${n.toLocaleString("ar-u-nu-latn")})`,
    searchNone: "لا توجد منتجات مطابقة",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { tr, en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
