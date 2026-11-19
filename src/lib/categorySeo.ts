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
  /**
   * The page's <h1> where it should say more than the category's name (which
   * stays the menu's, the trail's and "<Ad> Hakkında"'s word for it).
   */
  h1?: string;
}

// 2026-11-19 rollback test: celik-takimlar, kozlukler, klasik-takimlar and
// bitkisel-urunler are back on the generated title and intro description they
// had before 2026-11-11 (their impressions fell 40–75% the day after their own
// titles went live). Re-add one only after comparing Search Console again.
export const CATEGORY_SEO: Record<string, CategorySeo> = {
  // "nargile takımı" (10.5k real impressions in 90 days, position 8–11 until the
  // 2026-10-29 address change, 15–35 after) and "nargile takımı fiyatları": the
  // hub is their page. Within 60 characters, and the shop's name as every page has it.
  "nargile-takimlari": {
    title: "Nargile Takımı Modelleri ve Fiyatları | Nargile Malzemesi",
    description:
      "Nargile takımı modelleri ve fiyatları: Rus, çelik, kahveci (klasik), masaüstü ve çantalı takımlar. Orijinal ürün güvencesi, 3.000 TL üzeri ücretsiz kargo.",
    absolute: true,
    h1: "Nargile Takımı Modelleri ve Fiyatları",
  },
  // "oduman nargile" (1k impressions, CTR 0.2%), "oduman", "o duman nargile".
  // 2026-11-18: still CTR 0.3% at position ~10 for "oduman nargile" (326
  // impressions in two weeks): the query first, and what sets the shop apart.
  // 2026-11-19: "oduman nargile" + "o duman nargile" 1.2k impressions in 28
  // days, CTR under 0.9%: both spellings in the title, the models by name.
  oduman: {
    title: "Oduman (O Duman) Nargile Takımları ve Fiyatları",
    description:
      "Oduman nargile takımları Türkiye distribütöründen: Cosmo, Infinity, N2 Travel çantalı modeller, yedek şişe, lüle, aksesuar. 3.000 TL üzeri ücretsiz kargo.",
    absolute: true,
  },
  // "sultan nargile" (~500 impressions in two weeks, position ~8) lands on
  // single products, not on the brand's shelf (2026-11-18).
  sultan: {
    title: "Sultan Nargile Takımları: Nirvana ve Çantalı Modeller",
    description:
      "Sultan Nargile takımları: Nirvana serisi yer tipi, masaüstü ve 35 cm çantalı modeller, yedek şişe ve aksesuarlar. 3.000 TL üzeri ücretsiz kargo.",
    absolute: true,
  },
  // "quasar lüle" (~200 impressions, position ~10) lands on a single product (2026-11-18).
  "quasar-luleler": {
    title: "Quasar Lüle: Raas 2, Raas Mini ve Yedek Lüle Camı",
    description:
      "Quasar lüle çeşitleri: borosilikat cam hazneli Raas 2, Raas 2 Black ve Raas Mini ile yedek Raas lüle camı. Orijinal Quasar ürünleri, hızlı kargo.",
  },
  // "sipsi" (3.5k impressions in 90 days, position 4.3, CTR 0.2%), "nargile sipsi",
  // "sipsi nargile", "nargile sipsisi": the word itself leads. At /sipsiler again
  // since 2026-11-17 (it was /plastik-ve-slikon-sipsiler, which now leads here).
  // 2026-11-19: still CTR 0.3–1.9% at position 7.5–10 (~2k impressions in 28
  // days): "nargile sipsisi" and "fiyatları" in the title; the H1 stays.
  sipsiler: {
    title: "Nargile Sipsisi Çeşitleri ve Fiyatları | Plastik, Silikon",
    description:
      "Nargile sipsisi çeşitleri: hijyenik plastik ve silikon sipsiler, askılı, kehribar ve çelik modeller. Perakende ve toptan sipsi fiyatları, hızlı kargo.",
    absolute: true,
    h1: "Sipsi Çeşitleri: Plastik ve Silikon Nargile Sipsileri",
  },
  // "marpuç" (865 impressions, CTR 0.6%), "nargile marpucu", "nargile marpuç", "marpuc".
  // 2026-11-19: "marpuç" CTR 0.5% at position 8.5: the old title ran past 60
  // characters and was cut; now it fits, with "fiyatları".
  marpuclar: {
    title: "Nargile Marpucu Çeşitleri ve Fiyatları | Silikon Marpuç",
    description:
      "Nargile marpucu çeşitleri: yıkanabilir silikon, deri ve özel tasarım marpuçlar; Naimi, NFX ve daha fazlası. Perakende ve toptan marpuç fiyatları, hızlı kargo.",
    absolute: true,
  },
  // "mr wood nargile" (888 impr, pos 2.4), "mr wood" (385, pos 4.0), "mr.wood prisma".
  "mr-wood": {
    title: "Mr. Wood Nargile Takımları ve Fiyatları | Orijinal Mr Wood",
    description:
      "Ceviz ve mermer detaylı Mr. Wood nargile takımları ve şişeleri: orijinal ürün güvencesi, uygun fiyat ve 3.000 TL üzeri ücretsiz kargo.",
  },
  // "nargile lüle" (256 impr, pos 10.3, CTR 0.4%), "lüle" (125, pos 9.2), "lüle nargile" (239, 0 clicks).
  // 2026-11-17: "phunnel lüle" (1.1k impressions in 90 days), "toprak lüle" (630, pos 1.7, CTR 1.6%),
  // "seramik lüle" (551), "erkek lüle" / "dişi lüle" (423 each) — the types lead; the closing
  // passage has a section and product links for each.
  "luleler": {
    title: "Nargile Lülesi Çeşitleri: Toprak, Seramik, Phunnel, Killer",
    description:
      "Toprak, seramik, phunnel, killer ve cam nargile lüleleri; erkek ve dişi modeller. Oduman, Alpha Hookah, Kong, Cosmo Bowl ve daha fazlası, hızlı kargo.",
    h1: "Nargile Lülesi Çeşitleri",
  },
  // "nargile kömürü" (1.6k impr, pos 10.3, CTR 2%), "nargile kömürü fiyat", "nargile kömür". No free-shipping line: the coal rule.
  // 2026-11-19: 1.4k impressions at position ~10.8, CTR 1.9%: "fiyat" searches lead.
  "komurler": {
    title: "Nargile Kömürü Fiyatları ve Çeşitleri | Hindistan Cevizi",
    description:
      "Nargile kömürü fiyatları: SultanCoco, One Nation, BuCoco, Adya Coco's küp hindistan cevizi kömürleri; 27'li, 28'li kutu ve 20 kg toptan paket, hızlı kargo.",
  },
  // "hookah" (1.7k impr, pos 6.4, CTR 0.9%), "hookah nargile" (421, CTR 1.2%).
  // 2026-11-19: "hookah" 1.7k impressions at position 6.8, CTR 0.8%: the word on its own.
  "legend": {
    title: "Legend Hookah: Hookah Nargile Takımları ve Aksesuarları",
    description:
      "Orijinal Legend Hookah nargile takımları: masaüstü, yer tipi, çelik ve çantalı hookah modelleri, yedek şişe, lüle ve közlükler. 3.000 TL üzeri ücretsiz kargo.",
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
