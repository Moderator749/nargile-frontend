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
import { BILGI_DOCUMENTS, bilgiHref } from "@/lib/bilgi";
import { BLOG_HREF } from "@/lib/blog";
import { EMAIL, PHONE, WHATSAPP_HREF } from "@/lib/contact";
import { FAQ_HREF } from "@/lib/faq";
import { BLOG_LINKS, BRANCHES, FAQ_LINKS, SOCIAL_LINKS, WORKING_HOURS } from "@/lib/footer";
import { SHOWCASE_TILES } from "@/lib/showcase";
import { SIDEBAR_NAV, TOP_NAV } from "@/lib/storefrontNav";
import type { Homepage, HomeSections, HomeSeoIntro } from "@/types";

export const SECTION_LABELS: Record<keyof HomeSections, { title: string; hint: string }> = {
  hero: { title: "Hero Slider & Sol Kategori Menüsü", hint: "Sayfanın üstündeki kayan bant ve yanındaki kategori sütunu." },
  promos: { title: "Kategori Kutuları (slider altı)", hint: "Slider'ın altındaki iki sıra kampanya / kategori kutusu." },
  deals: { title: "Fırsatları Kaçırma", hint: "Kırmızı fırsat vitrini; aktif fırsat olsa bile gizlenir." },
  brands: { title: "Markalar Şeridi", hint: "Kayan marka adlarının olduğu kapsül." },
  showcase: { title: "Premium Ürün Yelpazesi", hint: "Başlık ve altındaki büyük kategori kutuları." },
  advantages: { title: "Ayrıcalıklar & Avantajlar", hint: "“Hacim büyür. Maliyet küçülür.” kartları." },
  about: { title: "Alt SEO Tanıtım Metni", hint: "Ana sayfanın sonundaki tanıtım metni; içeriği “Alt SEO Metni” sekmesinde." },
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
    promos: true,
    deals: true,
    brands: true,
    showcase: true,
    advantages: true,
    about: true,
    footer: true,
  },
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
  about: {
    stats: [
      { value: "17+", label: "Yıllık Tecrübe" },
      { value: "2", label: "Şube & Kurye Merkezi" },
      { value: "2.500+", label: "Ürün Çeşidi" },
      { value: "60+", label: "Global Marka" },
    ],
    text:
      "Dünyadaki tüm sektörel gelişmeleri ve yenilikleri yakından takip ediyoruz. " +
      "Küresel ölçekte kabul görmüş, kalitesi kanıtlanmış dünya markalarını da zengin " +
      "stoklarımıza katarak, nargile severlere geniş ve premium bir ürün yelpazesi " +
      "sunuyoruz. Toptan ve perakende nargile malzemesi tedariğinde Türkiye'nin öncü " +
      "adresiyiz.",
    badges: ["Orijinal Ürün Garantisi", "Aynı Gün Sevkiyat", "Toptan & Perakende"],
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
      links: BILGI_DOCUMENTS.map((doc) => ({ label: doc.title, href: bilgiHref(doc) })),
      cta_label: "",
      cta_href: null,
    },
    faq: { title: "Destek & S.S.S", links: FAQ_LINKS, cta_label: "Tüm soruları gör", cta_href: FAQ_HREF },
    copyright: "SULTAN NARGİLE. Tüm hakları saklıdır.",
    price_note: "Fiyatlara KDV dahildir. Döviz fiyatları TCMB kuruyla yaklaşıktır; ödeme TL ile alınır.",
    warning: "18 yaşından küçüklere satış yapılmaz. Tütün mamulleri sağlığa zararlıdır.",
  },
};

/** The saved sections over the defaults: a saved section wins whole. */
export function resolveHomepage(saved: Partial<Homepage> | null | undefined): Homepage {
  const merged: Homepage = { ...DEFAULT_HOMEPAGE, ...(saved ?? {}) };
  // Switches are merged one by one, so a switch added later defaults to on.
  merged.sections = { ...DEFAULT_HOMEPAGE.sections, ...(saved?.sections ?? {}) };
  return merged;
}
