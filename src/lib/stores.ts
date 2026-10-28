/**
 * The shop's two stores in Istanbul, each with a page of its own
 * (/magazalar/bahcelievler, /magazalar/esenyurt): what a search for a hookah
 * shop nearby finds, and where the stores' Google Business Profiles point.
 *
 * Name, address and phone must read word for word as on the store's Google
 * Business Profile: search engines tie a profile to a page by them.
 *
 * A store is `verified` once the shop has confirmed every field below. Until
 * then its page renders as a draft (a banner naming what is missing), is kept
 * out of search engines (noindex, not in the sitemap) and is not linked from
 * the footer — so nothing unconfirmed is ever published as fact.
 */

import { DEFAULT_LOCALE, localePath, type Locale } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/site";

export const STORES_HREF = "/magazalar";

/** schema.org's days, Monday first. */
export const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Day = (typeof WEEK)[number];

export interface OpeningHours {
  days: Day[];
  /** "09:30" (24-hour). */
  opens: string;
  closes: string;
}

export interface StorePhoto {
  /** Under /public, or the shop's media address. */
  src: string;
  width: number;
  height: number;
  alt: Record<Locale, string>;
}

export interface Store {
  slug: string;
  /** Has the shop confirmed every field? Until then: a draft, unindexed and unlinked. */
  verified: boolean;
  /** As on its Google Business Profile, word for word; null = not yet given. */
  businessName: string | null;
  district: Record<Locale, string>;
  /** Street, number, building: the line before the district. */
  street: string;
  /** "Soğanlı" — the neighbourhood the copy names. */
  neighbourhood: string;
  postalCode: string | null;
  /** The store's own line ("0212 …"); null = the shop's main number stands in. */
  phone: string | null;
  /** wa.me link of the store's own WhatsApp; null = the shop's. */
  whatsappHref: string | null;
  hours: OpeningHours[] | null;
  geo: { latitude: number; longitude: number } | null;
  /** Its place on Google Maps (the profile's "Share" link). */
  mapsUrl: string | null;
  /** The Google Business Profile itself, and any other page of its own (Instagram). */
  sameAs: string[];
  photos: StorePhoto[];
  /** Neighbouring districts, for "easy to reach from …". */
  nearby: string[];
  copy: Record<Locale, { title: string; heading: string; description: string; intro: string[] }>;
}

// Hours as the footer has always given them ("Hafta içi 09:30 – 20:00 ·
// Cumartesi 09:30 – 20:00"); Sunday is not stated there, so it is left out
// (closed) until the shop says otherwise.
const FOOTER_HOURS: OpeningHours[] = [
  { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "09:30", closes: "20:00" },
];

export const STORES: Store[] = [
  {
    slug: "bahcelievler",
    verified: false,
    businessName: null,
    district: { tr: "Bahçelievler", en: "Bahçelievler", ar: "باهتشيليفلر" },
    street: "Soğanlı Mah. Site Sok. No:5/A",
    neighbourhood: "Soğanlı",
    postalCode: null,
    phone: null,
    whatsappHref: null,
    hours: FOOTER_HOURS,
    geo: null,
    mapsUrl: null,
    sameAs: ["https://www.instagram.com/sultannargile_bahcelievler"],
    photos: [],
    nearby: ["Bakırköy", "Güngören", "Bağcılar", "Küçükçekmece"],
    copy: {
      tr: {
        title: "Bahçelievler Nargile Mağazası",
        heading: "Bahçelievler Nargile Mağazası",
        description:
          "Bahçelievler Soğanlı'daki mağazamızda nargile takımı, lüle, kömür, közlük ve marpuç çeşitlerini yerinde görün. Adres, çalışma saatleri ve yol tarifi.",
        intro: [
          "Nargile Malzemesi'nin Bahçelievler mağazası Soğanlı Mahallesi'nde. Nargile takımlarını, lüleleri, nargile kömürlerini, közlükleri ve marpuçları mağazamızda yakından inceleyebilir, size en uygun takımı seçmek için ekibimize danışabilirsiniz.",
          "Bakırköy, Güngören, Bağcılar ve Küçükçekmece gibi yakın semtlerden de kolayca ulaşabileceğiniz mağazamızda kafe ve işletmeler için toptan alım ve bayi fiyatları hakkında da bilgi alabilirsiniz. Aradığınız ürünün mağazada olup olmadığını gelmeden önce telefonla ya da WhatsApp'tan sorabilirsiniz.",
        ],
      },
      en: {
        title: "Hookah Shop in Bahçelievler, Istanbul",
        heading: "Our Hookah Shop in Bahçelievler",
        description:
          "Visit our hookah shop in Soğanlı, Bahçelievler, Istanbul: hookah sets, bowls, charcoal, heat management devices and hoses. Address, opening hours and directions.",
        intro: [
          "Nargile Malzemesi's Bahçelievler store is in the Soğanlı neighbourhood. See hookah sets, bowls, charcoal, heat management devices and hoses up close, and ask our team to help you choose the right set.",
          "Easy to reach from Bakırköy, Güngören, Bağcılar and Küçükçekmece. Cafés and lounges can ask about wholesale and dealer prices in store. To check that an item is in stock before you come, call or message us on WhatsApp.",
        ],
      },
      ar: {
        title: "متجر شيشة في باهتشيليفلر، إسطنبول",
        heading: "متجر الشيشة في باهتشيليفلر",
        description:
          "زوروا متجر الشيشة في سوغانلي، باهتشيليفلر، إسطنبول: أطقم شيشة، رؤوس، فحم، منظمات حرارة ولي. العنوان وساعات العمل والاتجاهات.",
        intro: [
          "يقع متجر Nargile Malzemesi في باهتشيليفلر في حي سوغانلي. شاهد أطقم الشيشة والرؤوس والفحم ومنظمات الحرارة واللي عن قرب، واستشر فريقنا لاختيار الطقم المناسب لك.",
          "يسهل الوصول إليه من باكركوي وغونغورن وباغجيلار وكوتشوك تشكمجة. يمكن للمقاهي الاستفسار عن أسعار الجملة والموزعين في المتجر. وللتأكد من توفر منتج قبل زيارتك، اتصل بنا أو راسلنا على واتساب.",
        ],
      },
    },
  },
  {
    slug: "esenyurt",
    verified: false,
    businessName: null,
    district: { tr: "Esenyurt", en: "Esenyurt", ar: "إسنيورت" },
    street: "Barbaros Hayrettin Paşa Mah. 1988 Sok. No:4 Papatya 1 Residence",
    neighbourhood: "Barbaros Hayrettin Paşa",
    postalCode: null,
    phone: null,
    whatsappHref: null,
    hours: FOOTER_HOURS,
    geo: null,
    mapsUrl: null,
    sameAs: ["https://www.instagram.com/sultannargile_esenyurt"],
    photos: [],
    nearby: ["Beylikdüzü", "Avcılar", "Büyükçekmece", "Başakşehir"],
    copy: {
      tr: {
        title: "Esenyurt Nargile Mağazası",
        heading: "Esenyurt Nargile Mağazası",
        description:
          "Esenyurt'taki mağazamızda nargile takımı, lüle, kömür, közlük ve marpuç çeşitlerini yerinde görün. Adres, çalışma saatleri ve yol tarifi.",
        intro: [
          "Nargile Malzemesi'nin Esenyurt mağazası Barbaros Hayrettin Paşa Mahallesi'nde. Nargile takımlarını, lüleleri, nargile kömürlerini, közlükleri ve marpuçları mağazamızda yakından inceleyebilir, size en uygun takımı seçmek için ekibimize danışabilirsiniz.",
          "Beylikdüzü, Avcılar, Büyükçekmece ve Başakşehir gibi yakın ilçelerden de kolayca ulaşabileceğiniz mağazamızda kafe ve işletmeler için toptan alım ve bayi fiyatları hakkında da bilgi alabilirsiniz. Aradığınız ürünün mağazada olup olmadığını gelmeden önce telefonla ya da WhatsApp'tan sorabilirsiniz.",
        ],
      },
      en: {
        title: "Hookah Shop in Esenyurt, Istanbul",
        heading: "Our Hookah Shop in Esenyurt",
        description:
          "Visit our hookah shop in Esenyurt, Istanbul: hookah sets, bowls, charcoal, heat management devices and hoses. Address, opening hours and directions.",
        intro: [
          "Nargile Malzemesi's Esenyurt store is in the Barbaros Hayrettin Paşa neighbourhood. See hookah sets, bowls, charcoal, heat management devices and hoses up close, and ask our team to help you choose the right set.",
          "Easy to reach from Beylikdüzü, Avcılar, Büyükçekmece and Başakşehir. Cafés and lounges can ask about wholesale and dealer prices in store. To check that an item is in stock before you come, call or message us on WhatsApp.",
        ],
      },
      ar: {
        title: "متجر شيشة في إسنيورت، إسطنبول",
        heading: "متجر الشيشة في إسنيورت",
        description:
          "زوروا متجر الشيشة في إسنيورت، إسطنبول: أطقم شيشة، رؤوس، فحم، منظمات حرارة ولي. العنوان وساعات العمل والاتجاهات.",
        intro: [
          "يقع متجر Nargile Malzemesi في إسنيورت في حي بارباروس خير الدين باشا. شاهد أطقم الشيشة والرؤوس والفحم ومنظمات الحرارة واللي عن قرب، واستشر فريقنا لاختيار الطقم المناسب لك.",
          "يسهل الوصول إليه من بيليك دوزو وأفجيلار وبيوك تشكمجة وباشاك شهير. يمكن للمقاهي الاستفسار عن أسعار الجملة والموزعين في المتجر. وللتأكد من توفر منتج قبل زيارتك، اتصل بنا أو راسلنا على واتساب.",
        ],
      },
    },
  },
];

export const storeHref = (store: Store) => `${STORES_HREF}/${store.slug}`;

export const findStore = (slug: string) => STORES.find((s) => s.slug === slug) ?? null;

/** The stores a search engine may read and the footer may link to. */
export const publishedStores = () => STORES.filter((s) => s.verified);

/** The footer's branch line ("Bahçelievler") → its store, by district. */
export const storeForBranch = (name: string) =>
  STORES.find((s) => s.district.tr.toLocaleLowerCase("tr") === name.trim().toLocaleLowerCase("tr")) ?? null;

/** "Soğanlı Mah. … No:5/A Bahçelievler / İstanbul", as the footer writes it. */
export const fullAddress = (store: Store) => `${store.street} ${store.district.tr} / İstanbul`;

/** Where "Yol Tarifi" goes: the profile's own map link, else a Google Maps search for the address. */
export const directionsHref = (store: Store) =>
  store.mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(store))}`;

/** The map shown when the visitor asks for it: by coordinates where given, else by address. */
export const mapEmbedSrc = (store: Store) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(
    store.geo ? `${store.geo.latitude},${store.geo.longitude}` : fullAddress(store),
  )}&z=16&output=embed`;

/** What the shop still has to send before a draft is published, in the draft banner's words (Turkish: it is the shop's). */
export function missingFields(store: Store): string[] {
  return [
    !store.businessName && "İşletme Profili'ndeki işletme adı",
    !store.postalCode && "posta kodu",
    !store.phone && "mağaza telefonu",
    !store.geo && "harita konumu (enlem/boylam)",
    !store.mapsUrl && "Google Haritalar bağlantısı",
    !store.sameAs.some((u) => /google\.|g\.page|goo\.gl/.test(u)) && "Google İşletme Profili bağlantısı",
    store.photos.length === 0 && "mağaza fotoğrafları",
    // The hours are the footer's; Sunday is not stated there.
    "çalışma saatlerinin teyidi (Pazar dahil)",
  ].filter((field): field is string => !!field);
}

/**
 * The store as schema.org reads it: a `Store` (a kind of LocalBusiness), a
 * branch of the shop's organization (the homepage's `#organization`), with
 * only what the shop has confirmed — a guessed field is worse than none.
 */
export function storeJsonLd(store: Store, locale: Locale = DEFAULT_LOCALE, fallbackPhone?: string | null) {
  const url = `${SITE_URL}${localePath(locale, storeHref(store))}`;
  const phone = store.phone ?? fallbackPhone ?? null;
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}${storeHref(store)}#store`,
    name: store.businessName ?? `Nargile Malzemesi ${store.district.tr}`,
    url,
    ...(store.photos.length > 0 ? { image: store.photos.map((p) => (p.src.startsWith("/") ? `${SITE_URL}${p.src}` : p.src)) } : {}),
    ...(phone ? { telephone: phone } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: store.street,
      addressLocality: store.district.tr,
      addressRegion: "İstanbul",
      ...(store.postalCode ? { postalCode: store.postalCode } : {}),
      addressCountry: "TR",
    },
    ...(store.geo ? { geo: { "@type": "GeoCoordinates", ...store.geo } } : {}),
    ...(store.hours
      ? {
          openingHoursSpecification: store.hours.map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.days.map((d) => `https://schema.org/${d}`),
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    ...(store.mapsUrl ? { hasMap: store.mapsUrl } : {}),
    ...(store.sameAs.length > 0 ? { sameAs: store.sameAs } : {}),
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
  };
}
