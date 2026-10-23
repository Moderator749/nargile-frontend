/**
 * "Ana Sayfa Düzenleme": the homepage, its menus and the footer as one
 * document, and the defaults that fill whatever the admin has not saved.
 *
 * The API stores only the sections the admin has saved (`/home/settings`), and
 * each one it stores is complete. So the merge is one level deep: a saved
 * section replaces the default section whole, an unsaved one is the default.
 * The defaults are the storefront exactly as it was built, which is why they
 * live here, next to the images and copy they name, rather than in the
 * database.
 */

import { ADVANTAGES } from "@/lib/advantages";
import { HOME_BLOCKS, resolveBlockOrder } from "@/lib/homeBlocks";
import { DEFAULT_SECTION_COPY } from "@/lib/homeSectionCopy";
import { BILGI_DOCUMENTS, PERKS_PAGE, bilgiHref } from "@/lib/bilgi";
import { BLOG_HREF } from "@/lib/blog";
import { EMAIL, PHONE, WHATSAPP_HREF } from "@/lib/contact";
import { FAQ_HREF } from "@/lib/faq";
import { BLOG_LINKS, BRANCHES, FAQ_LINKS, SOCIAL_LINKS, WORKING_HOURS } from "@/lib/footer";
import { SHOWCASE_TILES } from "@/lib/showcase";
import { SIDEBAR_NAV, TOP_NAV } from "@/lib/storefrontNav";
import type { Homepage, HomeMobileSection, HomeSections, HomeSeoIntro } from "@/types";

export const SECTION_LABELS: Record<keyof HomeSections, { title: string; hint: string }> = {
  hero: { title: "Hero Slider & Sol Kategori Menüsü", hint: "Sayfanın üstündeki kayan bant ve yanındaki kategori sütunu. Hep en üstte." },
  perks: { title: "Avantaj Çubuğu", hint: "Taksit, sepette indirim ve havale indirimi satırı." },
  brands_top: { title: "Markalar Şeridi (üst)", hint: "Avantaj çubuğunun altındaki kayan marka adları." },
  picks: { title: "Sizin İçin Seçtiklerimiz", hint: "Çok satanlar ve yeni gelenler sekmeli ürün satırı." },
  lules: { title: "Lüle Alırken Kararsız Kalacaksınız", hint: "Lüle ürün satırı ve kurye ayrıcalığı." },
  sultanpuan: { title: "SultanPuan Bandı", hint: "%10 SultanPuan kartı ve ürünleri; program kapalıyken görünmez." },
  kumbara: { title: "Kumbara 20.000 TL", hint: "Yıllık bonus kartı ve marpuçlar; bonus kapalıyken görünmez." },
  bento: { title: "Görsel Vitrin", hint: "İki sekmeli görsel kutular: biri bento (3 dikey + 2 yatay), biri 3 yatay 16:9. Kutularda yazı yok." },
  deals: { title: "Fırsatları Kaçırma", hint: "Kırmızı fırsat vitrini; aktif fırsat olsa bile gizlenir." },
  campaigns: { title: "Kampanya Kutuları", hint: "Büyük fırsat kutusu ve yanındaki üç küçük kutu (mini bento)." },
  promos: { title: "Sektörde Referans Noktası", hint: "Kısa marka tanıtımı ve kataloğa bağlantı." },
  brands: { title: "Markalar Şeridi (alt)", hint: "Tanıtımın altındaki kayan marka adları; üst şeritle aynı adlar." },
  brand_showcase: { title: "Markalarımız", hint: "Marka başına bir ürün bandı." },
  kozlukler: { title: "Közlükler", hint: "Közlükler kategorisi ürün satırı (kaydırmalı)." },
  games: { title: "Oyun & Eğlence", hint: "Tavla, okey ve iskambil ürün satırı (kaydırmalı)." },
  showcase: { title: "Premium Ürün Yelpazesi", hint: "Başlık ve altındaki kategori kutuları (bento)." },
  advantages: { title: "Ayrıcalıklar & Avantajlar", hint: "“Hacim büyür. Maliyet küçülür.” kartları." },
  about: { title: "Alt SEO Tanıtım Metni", hint: "Ana sayfanın ve kategori sayfalarının sonundaki tanıtım metni." },
  footer: { title: "Footer (Alt Bilgi)", hint: "İletişim kartları, dört kolon ve yasal uyarı. Tüm sayfalarda." },
};

/** The shop's own copy for "Alt SEO Metni": shown until an admin writes theirs, and for any field left empty. */
export const DEFAULT_SEO_INTRO: HomeSeoIntro = {
  title: "Türkiye'nin Lider Nargile Malzemeleri ve Toptan Tedarikçisi",
  summary:
    "Geleneksel nargile kültürünü modern mühendislikle buluşturan NargileMalzemesi, birinci sınıf paslanmaz çelik nargile takımları, premium lüle çeşitleri ve yüksek kaliteli nargile kömürleri ile sektörün öncüsüdür. Sultan Nargile, Oduman ve Legend Hookah gibi dünya standartlarındaki markaları tek bir çatı altında sunuyoruz.",
  content:
    "Bireysel nargile severler için kusursuz bir içim deneyimi sunarken, kafeler ve işletmeler için toptan nargile malzemeleri tedariğinde güvenilir çözüm ortağınızız. Hızlı kargo, orijinal ürün garantisi ve otomatik ciro indirimleriyle, ihtiyacınız olan tüm profesyonel aksesuarlar güvenle kapınızda.",
};

export const DEFAULT_HOMEPAGE: Homepage = {
  sections: {
    hero: true,
    perks: true,
    brands_top: true,
    picks: true,
    lules: true,
    sultanpuan: true,
    kumbara: true,
    bento: true,
    deals: true,
    campaigns: true,
    promos: true,
    brands: true,
    brand_showcase: true,
    kozlukler: true,
    games: true,
    showcase: true,
    advantages: true,
    about: true,
    footer: true,
  },
  order: [...HOME_BLOCKS],
  navigation: { top: TOP_NAV, sidebar: SIDEBAR_NAV },
  deals: {
    title: "FIRSATLARI KAÇIRMA",
    subtitle: "nargilemalzemesi.com'da her sipariş ayrıcalıklı. Fırsat ürünleri stoklarla sınırlıdır.",
  },
  brands: {
    items: [
      "Alkamik Bowl",
      "Caos Bowl",
      "Cosmo Bowl",
      "Oblako",
      "Alpha Hookah",
      "Tangiers",
      "Darkside",
      "Musthave",
      "Starbuzz",
      "DSH",
      "Hoob",
      "Mattpear",
    ],
  },
  showcase: { title: "Premium Ürün Yelpazesi", subtitle: "", tiles: SHOWCASE_TILES },
  advantages: {
    eyebrow: "Ayrıcalıklar & Avantajlar",
    title: "Hacim büyür. Maliyet küçülür.",
    subtitle: "Sultan Nargile ile alışverişlerinizde toptan ve perakende ayrıcalıklarından yararlanın.",
    cards: ADVANTAGES,
  },
  seo_intro: DEFAULT_SEO_INTRO,
  footer: {
    brand_name: "SULTAN NARGİLE",
    tagline: "EST. 2008 · İSTANBUL",
    phone: PHONE,
    email: EMAIL,
    whatsapp_href: WHATSAPP_HREF,
    branches: BRANCHES.map((b) => ({ ...b })),
    hours: WORKING_HOURS,
    social: SOCIAL_LINKS.map((s) => ({ ...s })),
    blog: { title: "Blog", links: BLOG_LINKS, cta_label: "Tüm yazıları gör", cta_href: BLOG_HREF },
    info: {
      title: "Bilgi Sayfaları",
      links: [
        ...BILGI_DOCUMENTS.map((doc) => ({ label: doc.title, href: bilgiHref(doc) })),
        { label: PERKS_PAGE.title, href: PERKS_PAGE.href },
      ],
      cta_label: "",
      cta_href: null,
    },
    faq: { title: "Destek & S.S.S", links: FAQ_LINKS, cta_label: "Tüm soruları gör", cta_href: FAQ_HREF },
    copyright: "SULTAN NARGİLE. Tüm hakları saklıdır.",
    price_note: "Fiyatlara KDV dahildir. Döviz fiyatları TCMB kuruyla yaklaşıktır; ödeme TL ile alınır.",
    warning: "18 yaşından küçüklere satış yapılmaz. Tütün mamulleri sağlığa zararlıdır.",
  },
  // A phone shows the whole page and the slides' wide photos until the admin says otherwise.
  mobile: { hero_images: [], hidden: [] },
  // The sections' own words, pictures and links (lib/homeSectionCopy).
  ...DEFAULT_SECTION_COPY,
};

/** "Mobil Yönetim": the sections a phone can go without, in page order, as the switches name them. */
export const MOBILE_SECTION_LABELS: { key: HomeMobileSection; title: string; hint: string }[] = [
  { key: "perks", title: "Mobilde Avantaj Çubuğunu Gizle", hint: "Hero'nun altındaki taksit, sepet ve havale indirimi satırı." },
  { key: "promos", title: "Mobilde Hero Kutularını Gizle", hint: "Slider'ın altındaki \"Topluluğa Katılın\" ve avantajlar kutuları." },
  { key: "brand_ticker", title: "Mobilde Marka Şeridini Gizle", hint: "Kayan marka adları şeridi (her iki şerit)." },
  { key: "lules", title: "Mobilde Lüle Bandını Gizle", hint: "\"Lüle Alırken Kararsız Kalacaksınız\" ürün satırı." },
  { key: "sultanpuan", title: "Mobilde SultanPuan Bandını Gizle", hint: "%10 SultanPuan kartı ve ürünleri." },
  { key: "kumbara", title: "Mobilde Kumbara Bandını Gizle", hint: "\"Kumbara 20.000 TL\" kartı ve marpuçlar." },
  { key: "bento", title: "Mobilde Görsel Vitrini Gizle", hint: "Fırsatların üstündeki iki sekmeli görsel kutular." },
  { key: "campaigns", title: "Mobilde Kampanya Kutularını Gizle", hint: "Fırsatların altındaki büyük kutu ve üç küçük kutu." },
  { key: "brand_statement", title: "Mobilde Marka Metnini Gizle", hint: "\"Sektörde Referans Noktası\" bölümü." },
  { key: "brand_showcase", title: "Mobilde Markalarımız'ı Gizle", hint: "Marka başına bir ürün bandı." },
  { key: "kozlukler", title: "Mobilde Közlükler Satırını Gizle", hint: "Közlükler ürün satırı." },
  { key: "games", title: "Mobilde Oyun & Eğlence Satırını Gizle", hint: "Tavla, okey ve iskambil ürün satırı." },
  { key: "showcase", title: "Mobilde Premium Yelpazeyi Gizle", hint: "\"Premium Ürün Yelpazesi\" kategori galerisi." },
];

/** The saved sections over the defaults: a saved section wins whole. */
export function resolveHomepage(saved: Partial<Homepage> | null | undefined): Homepage {
  const merged: Homepage = { ...DEFAULT_HOMEPAGE, ...(saved ?? {}) };
  // Switches are merged one by one, so a switch added later defaults to on —
  // but for the top brand ticker, which "brands" switched before it had its own.
  merged.sections = {
    ...DEFAULT_HOMEPAGE.sections,
    brands_top: saved?.sections?.brands ?? true,
    ...(saved?.sections ?? {}),
  };
  // A section the saved order does not name takes its default place.
  merged.order = resolveBlockOrder(saved?.order);
  return merged;
}
