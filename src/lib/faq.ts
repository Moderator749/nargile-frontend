/**
 * The support questions the footer lists, answered on /sss.
 *
 * The answers follow what the shop actually does — the price and delivery
 * answers say what `lib/shipping` and the B2B registration enforce — so a
 * change there is a change here. The same list builds the FAQPage JSON-LD.
 */

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

/** Schema.org FAQPage, built from the same list the page shows. */
export function faqJsonLd(items: FaqItem[] = FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
