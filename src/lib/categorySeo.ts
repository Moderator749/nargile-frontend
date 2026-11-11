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
      "Hijyenik, kişiye özel nargile sipsileri: silikon, plastik, askılı ve kehribar modeller. Perakende ve toptan sipsi fiyatları, hızlı kargo.",
    // Past 60 characters already: the shop's name would only be cut off.
    absolute: true,
  },
  // "marpuç" (865 impressions, CTR 0.6%), "nargile marpucu", "nargile marpuç", "marpuc".
  marpuclar: {
    title: "Nargile Marpuçları: Yıkanabilir Silikon & Özel Tasarım Marpuçlar",
    description:
      "Hijyenik, yıkanabilir silikon ve özel tasarım nargile marpucu modelleri: Naimi ve daha fazlası. Perakende ve toptan marpuç fiyatları, hızlı kargo.",
    // Past 60 characters already: the shop's name would only be cut off.
    absolute: true,
  },
};
