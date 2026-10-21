/**
 * The support questions the footer lists, answered on /sss.
 *
 * The answers follow what the shop actually does — the price and delivery
 * answers say what `lib/shipping` and the B2B registration enforce — so a
 * change there is a change here. The same list builds the FAQPage JSON-LD.
 *
 * English and Arabic answers live in lib/content (faq.en, faq.ar), under the
 * same ids; read them through `faqItems(locale)`.
 */

import { FAQ_AR } from "@/lib/content/faq.ar";
import { FAQ_EN } from "@/lib/content/faq.en";
import type { Locale } from "@/lib/i18n/config";

export const FAQ_HREF = "/sss";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ: FaqItem[] = [
  {
    id: "toptan-fiyatlar",
    question: "Toptan fiyatları nasıl görebilirim?",
    answer:
      "Toptan fiyatlar firma hesaplarına özeldir. Kayıt sayfasından kafe, tütün satış noktası veya şirket olarak başvurun; vergi levhanız ve varsa TAPDK belgeniz incelenip hesabınız onaylandığında size tanımlanan fiyatlar, giriş yaptığınızda tüm katalogda görünür. Güncel fiyat listesi için WhatsApp üzerinden de ekibimize yazabilirsiniz.",
  },
  {
    id: "markalar",
    question: "Hangi markaların Türkiye dağıtımını yapıyorsunuz?",
    answer:
      "Kendi markalarımız Sultan Nargile ve Legend Hookah'ı üretiyor, Oduman Nargile'nin Türkiye dağıtımını yapıyoruz. Ayrıca Adalya, Revoshi, Daim, Manterra ve Rosanna gibi tütün; Black Coco's, Coco Pearls, One Nation ve BuCoco gibi kömür markalarının yetkili bayisiyiz.",
  },
  {
    id: "minimum-siparis",
    question: "Toptan alım için minimum sipariş tutarı var mı?",
    answer:
      "Toptan siparişlerde minimum tutar kategoriye göre değişir; güncel fiyat listesi ve minimum adet bilgisi için WhatsApp üzerinden ekibimize ulaşmanız yeterli.",
  },
  {
    id: "kafe-teslimat",
    question: "Toptan alımlarda kafelere yada mağazalara teslimat var mı ?",
    answer:
      "Evet. Kayıtlı adresi İstanbul'da olan kafe ve mağazalara kendi aracımızla ücretsiz teslimat yapıyor, teslimattan önce sizi arıyoruz. Diğer illere Yurtiçi Kargo ile adrese teslim ya da nakliye ambarı ile gönderim yapılır; firma gönderilerinde kargo veya ambar ücreti teslim alırken ödenir.",
  },
];

const BY_LOCALE: Record<Locale, FaqItem[]> = { tr: FAQ, en: FAQ_EN, ar: FAQ_AR };

/** The questions and answers in a language, in the Turkish order. */
export const faqItems = (locale: Locale): FaqItem[] => BY_LOCALE[locale];

/** schema.org's `inLanguage` (BCP 47), as lib/seo writes it. */
const IN_LANGUAGE: Record<Locale, string> = { tr: "tr-TR", en: "en", ar: "ar" };

/** Schema.org FAQPage, built from the same list the page shows, in the page's language. */
export function faqJsonLd(items: FaqItem[] = FAQ, locale?: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(locale ? { inLanguage: IN_LANGUAGE[locale] } : {}),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
