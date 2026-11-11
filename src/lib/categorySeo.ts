/**
 * A category's own <title> and meta description on its Turkish page, written
 * for the searches it is found by (Search Console, 2026-11): the generated
 * "<Ad> Modelleri ve Fiyatları" title and the intro's first paragraph serve
 * every other category, and the English and Arabic pages of these.
 *
 * `absolute`: the title already names the shop, so " | Nargile Malzemesi" is
 * not added; otherwise lib/seo adds it where it fits in 60 characters.
 *
 * The free-shipping figure is the panel's threshold today (3.000 TL): change
 * it here too if the panel's changes.
 */
export interface CategorySeo {
  title: string;
  description: string;
  absolute?: boolean;
}

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  // "nargile takımı" (14.5k impressions a month, CTR 0.3%) and "nargile takımı
  // fiyatları" (9.2k, 0.06%) were going to /klasik-takimlar: this is their page.
  "nargile-takimlari": {
    title: "Nargile Takımları ve Fiyatları | Çelik, Rus & Klasik Modeller - Sultan Nargile",
    description:
      "En iyi nargile takımı modelleri indirimli fiyatlarla Sultan Nargile'de! Orijinal çelik, Rus ve masaüstü nargile takımlarını 3.000 TL üzeri ücretsiz kargo ile keşfedin.",
    absolute: true,
  },
  // "oduman nargile" (1k impressions, CTR 0.2%), "oduman", "o duman nargile".
  oduman: {
    title: "Orijinal Oduman Nargile Modelleri & Uygun Fiyatlar",
    description:
      "Orijinal Oduman nargile takımları, lüleleri ve aksesuarları uygun fiyatlarla. Kafe ve toptan alımlara özel fiyatlar, 3.000 TL üzeri ücretsiz kargo.",
  },
  // "sipsi" (935 impressions, CTR 0.3%), "nargile sipsi", "sipsi nargile", "nargile sipsisi".
  "plastik-ve-slikon-sipsiler": {
    title: "Nargile Sipsisi Çeşitleri: Hijyenik Silikon & Özel Tasarım Sipsiler",
    description:
      "Hijyenik, kişiye özel nargile sipsileri (ağızlıkları): silikon, plastik, askılı ve kehribar modeller. Perakende ve toptan sipsi fiyatları, hızlı kargo.",
    // Past 60 characters already: the shop's name would only be cut off.
    absolute: true,
  },
  // "marpuç" (865 impressions, CTR 0.6%), "nargile marpucu", "nargile marpuç", "marpuc".
  marpuclar: {
    title: "Nargile Marpuçları: Yıkanabilir Silikon & Özel Tasarım Marpuçlar",
    description:
      "Hijyenik, yıkanabilir silikon nargile marpucu (hortumu) ve özel tasarım modeller: Naimi ve daha fazlası. Perakende ve toptan marpuç fiyatları, hızlı kargo.",
    // Past 60 characters already: the shop's name would only be cut off.
    absolute: true,
  },
  // "çelik nargile takımı" (489 impr, pos 7.4); "nargile takımı fiyatları" splits to it (1.2k impr, 0 clicks).
  "celik-takimlar": {
    title: "Paslanmaz Çelik Nargile Takımları ve Fiyatları",
    description:
      "Paslanmaz çelik gövdeli, uzun ömürlü ve kolay temizlenen nargile takımları: Legend Hookah ve Sultan Nargile modelleri, 3.000 TL üzeri ücretsiz kargo.",
  },
  // "mr wood nargile" (888 impr, pos 2.4), "mr wood" (385, pos 4.0), "mr.wood prisma".
  "mr-wood": {
    title: "Mr. Wood Nargile Takımları ve Fiyatları | Orijinal Mr Wood",
    description:
      "Ceviz ve mermer detaylı Mr. Wood nargile takımları ve şişeleri: orijinal ürün güvencesi, uygun fiyat ve 3.000 TL üzeri ücretsiz kargo.",
  },
  // "nargile lüle" (256 impr, pos 10.3, CTR 0.4%), "lüle" (125, pos 9.2), "lüle nargile" (239, 0 clicks).
  "luleler": {
    title: "Nargile Lülesi Çeşitleri ve Fiyatları: Toprak, Phunnel, Cam",
    description:
      "Toprak, sırlı, phunnel ve cam nargile lüleleri: Oblako, Alpha Hookah, Cosmo Bowl, Kong ve daha fazlası. Orijinal ve replika modeller, hızlı kargo.",
  },
  // "nargile kömürü" (1.6k impr, pos 10.3, CTR 2%), "nargile kömürü fiyat", "nargile kömür". No free-shipping line: the coal rule.
  "komurler": {
    title: "Nargile Kömürü Çeşitleri ve Fiyatları: Küp Hindistan Cevizi",
    description:
      "SultanCoco, One Nation, BuCoco, Adya Coco's ve daha fazlası: küp hindistan cevizi nargile kömürleri, kutu ve 20 kg toptan paketler, hızlı kargo.",
  },
  // "nargile közlük" (399 impr, pos 7.5, CTR 1.8%, down 63%).
  // "hmd" (1.9k impr in 90 days), "kaloud" (634), "lotus" (612): the HMDs this shelf holds.
  "kozlukler": {
    title: "Nargile Közlüğü ve HMD | Kaloud Lotus, Copper Balance",
    description:
      "Kaloud Lotus ve Copper Balance HMD'leri ile Legend Hookah, Oduman, Steamulation közlükleri: kömürü sıcak ve dengede tutan ısı yönetim araçları.",
  },
  // "hookah" (1.7k impr, pos 6.4, CTR 0.9%), "hookah nargile" (421, CTR 1.2%).
  "legend": {
    title: "Legend Hookah Nargile Takımları ve Aksesuarları",
    description:
      "Orijinal Legend Hookah nargile takımları, lüleleri, közlükleri ve çantaları: masaüstü ve çelik modeller, uygun fiyat, 3.000 TL üzeri ücretsiz kargo.",
  },
  // "masa üstü nargile" (250 impr, pos 13.1, down 93%), "masa üstü nargile takımı" (117, pos 4.6). No LED: none of its products is.
  "masaustu-takimlar": {
    title: "Masaüstü Nargile Takımları ve Fiyatları | Masa Üstü Modeller",
    description:
      "Kısa boylu, kompakt masaüstü nargile takımları: Legend Hookah, Oduman, Panada ve Quasar modelleri. Küçük alanlar için, 3.000 TL üzeri ücretsiz kargo.",
  },
  // "rus nargile takımı" (187 impr, pos 4.7), "rus nargile takımları" (186, pos 5.5). Darkside sets are unpublished: not named.
  "rus-takimlar": {
    title: "Rus Nargile Takımları ve Fiyatları",
    description:
      "Alpha Hookah, Steamulation, Union ve daha fazlası: hafif çekişli, kolay temizlenen Rus nargile takımı modelleri. 3.000 TL üzeri ücretsiz kargo.",
  },
  // "nargile malzemeleri" (775 impr, pos 5.0, down from 3.8), "nargile aksesuarları" (138, pos 13.1).
  "malzemeler": {
    title: "Nargile Malzemeleri ve Aksesuarları | Ocak, Folyo, Rüzgarlık",
    description:
      "Elektrikli ocaklar, folyolar, rüzgarlıklar, çakmaklar ve daha fazlası: Clipper, Zemu, Mococo, Steamulation gibi markaların orijinal nargile malzemeleri.",
  },
  // "kahveci nargile takımı" (616 impr), "pirinç nargile takımı" (336), "osmanlı nargile takımı" (158): its products are döküm and pirinç.
  "klasik-takimlar": {
    title: "Döküm ve Pirinç Nargile Takımları | Klasik Kahveci Modeller",
    description:
      "Geleneksel döküm ve pirinç nargile takımları: Kahveci, Tuğralı, Şehzade, Hürrem ve daha fazlası. Orijinal ürün, 3.000 TL üzeri ücretsiz kargo.",
  },
  // Where the old "nargile tütünü" page now leads (10.4k impr, pos 6.5, clicks -47%). Herbal products only: no tobacco wording beyond saying they contain none.
  "bitkisel-urunler": {
    title: "Bitkisel Nargile Aromaları: Falcon ve Cosmic Çeşitleri",
    description:
      "Tütün içermeyen bitkisel nargile aromaları: Falcon 250 gr ve Cosmic 200 gr çeşitleri, orijinal ürün güvencesiyle ve hızlı kargo ile.",
  },
  // Shoppers search "yedek cam" / "nargile camı" (2k impressions, 0 clicks, on a
  // bowl part); the shop calls them şişe, and the page and product names stay
  // so. The title bridges the two; the types are what is stocked (geçme,
  // Legend's kilitli and vidalı, the brands' own) — no "Rus" range is.
  siseler: {
    title: "Nargile Şişeleri ve Yedek Cam Çeşitleri | Geçme & Markalı",
    description:
      "Kırılan takımınıza uygun orijinal nargile şişesi ve yedek cam modelleri: geçme (contalı), kilitli ve vidalı şişeler; Oduman, Legend, Mr.Wood, Steamulation.",
  },
};
