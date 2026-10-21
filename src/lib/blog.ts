/**
 * The shop's articles. There is one so far — the lüle guide from
 * nargilemalzemesi.com — and each footer blog link opens one of its sections.
 *
 * Section bodies use the `LegalText` format: blank lines between paragraphs and
 * `## ` for a sub-heading.
 *
 * English and Arabic copies live in lib/content (blog.en, blog.ar), section
 * for section under the same slug and anchor ids; read them through
 * `articles(locale)` and `article(slug, locale)`.
 */

import { LULE_GUIDE_AR } from "@/lib/content/blog.ar";
import { LULE_GUIDE_EN } from "@/lib/content/blog.en";
import type { Locale } from "@/lib/i18n/config";

export const BLOG_HREF = "/blog";

export interface ArticleSection {
  /** Anchor id; the footer links to these. */
  id: string;
  title: string;
  body: string;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  intro: string;
  sections: ArticleSection[];
}

export const LULE_GUIDE: Article = {
  slug: "nargile-lule-rehberi",
  title: "Nargile Lülesi Rehberi: Doğru Lüle Seçimi ve Çeşitleri",
  description:
    "Nargile lülesi nedir, Phunnel ve Killer lüle farkı, sırlı ve sırsız lüle seçimi ve malzemesine göre doğru lüle: Sultan Nargile'den kapsamlı rehber.",
  datePublished: "2026-04-10",
  intro:
    "Nargile içim performansını ve aromasını belirleyen en önemli ekipmanların başında nargile lülesi gelir. Doğru lüleyi seçmek; dolum tekniğinden ısı yönetimine, içimin yumuşaklığından aromanın yoğunluğuna kadar her şeyi değiştirir.",
  sections: [
    {
      id: "lule-nedir",
      title: "Nargile lülesi nedir, çeşitleri var mıdır?",
      body: `Lülenin temel işlevi, içine konan nargile tütününden ısı yardımıyla duman üretmektir. Lüleler genellikle 15–25 gram arası tütün kapasitesine sahiptir.

Günümüzde toprak, kil, taş ve seramik gibi geleneksel çamur türevlerinden üretilen sırlı veya sırsız modellerin yanı sıra cam, silikon ve metal malzemelerden üretilen modern seçenekler de mevcuttur. Tasarımlarına göre ise lüleler temel olarak Phunnel lüle ve Killer lüle olmak üzere iki ana kategoriye ayrılır.`,
    },
    {
      id: "phunnel-killer",
      title: "Phunnel ve Killer lüle arasındaki fark nedir?",
      body: `Nargile severlerin en çok kararsız kaldığı konulardan biri tasarım seçimidir. Her iki modelin de kendine has dolum ve içim dinamikleri bulunur.

## Phunnel lüle

Phunnel modellerde tütün çukurunun tabanında, merkezden yaklaşık 10 mm yükselen tek bir delik yer alır.

Yüksek hava akışı: Tütün dolumu yapıldığında ortadaki delik kapanmaz; böylece rahat ve ferah bir çekim sağlanır.

Temiz takım ve şişe: İçim sırasında lüle tabanından ser borusuna veya difüzöre tütün düşmez, tıkanma olmaz. Tütün şerbeti takıma ve şişeye akmadığı için takımınız temiz kalır.

Uzun ömürlü ve yoğun tat: Lülede kalan şerbet tütünün kurumasını önler; aroma daha yoğun, içim süresi daha uzun olur.

Yumuşak içim: Folyo veya közlük (HMD) kullanımında duman üstten yanmayla başlar. Merkezdeki deliğin üzerinde doğrudan tütün olmadığından dumanla birlikte daha fazla hava çekilir ve içim yumuşar.

## Killer lüle

Killer (klasik delikli) modellerde tütün çukurunun tabanında 4 ile 7 arasında delik bulunur.

Gevşek dolum: Tütün, lüle üst seviyesinin 2–3 mm altında kalacak şekilde, adeta tuz eker gibi gevşek doldurulmalıdır. Üstten bakıldığında delikler değil, yalnızca tütün görünmelidir.

Hava akışı yönetimi: Deliklerin tıkanmaması rahat çekim için kritiktir; bu modellerde lüle içi elek kullanımı tavsiye edilir.

Yoğun ve sert duman: Hava doğrudan tütünün içinden ve alttaki deliklerden geçer. Duman çok daha yoğun, doyurucu ve nispeten sert (tok) hissedilir.`,
    },
    {
      id: "sirli-sirsiz",
      title: "Sırlı lüle mi, sırsız lüle mi? Hangi lüleyi satın almalıyım?",
      body: `Çamur türevli lülelerin (toprak, kil, seramik) dış yüzeyine ve tütün çukuruna uygulanan renkli, desenli koruyucu katmana sır adı verilir.

## Sırsız lüleler (toprak ve kil)

Aroma bağlama: Sırsız lüleler fırınlanmış olsalar bile mikroskobik gözenekleri sayesinde zamanla tütün şerbetini emer. Bu yüzden sırsız lülede hep aynı aromayı (örneğin yalnızca çift elma veya yalnızca nane) içmek gerekir; farklı tatlar kullanıldığında kokular karışır ve performans düşer.

Lülenin kusması: Temizlik sırasında emilen su ve şerbet lüle içinde kalır, ısı gördüğünde genleşerek dışarı sızar. Fırınlaması yüksek, sert lülelerde daha az görülür. Görsel bir kirlilik yaratsa da sürekli aynı aroma içildiğinde tat yoğunluğunu artırır.

## Sırlı lüleler (seramik ve taş)

Çok yönlü kullanım: Sır tabakası şerbetin emilmesini engeller; aynı lüleyle farklı tütün ve aromalar sorunsuzca denenebilir.

Kolay temizlik: Pürüzsüz yüzeyi sayesinde içim sonrası temizliği oldukça pratiktir.

Tasarım farkı: Sırlı Phunnel modellerde şerbet emilimi sıfıra yakındır. Sırlı Killer modellerde şerbet deliklerden akarken iç yüzeye yapışabildiği için hafif bir koku kalabilir; yine de kusma yapmaz ya da çok az yapar.`,
    },
    {
      id: "malzeme-secimi",
      title: "Hangi nargile lülesini satın almalıyım?",
      body: `Keyifli bir içim doğru ısı yönetimiyle başlar. Isıyı 1–2 dakika içinde ideal seviyeye getirmek ve içim boyunca sabit tutabilmek lülenin malzemesine bağlıdır. Doğru lüle seçilmediğinde elinizde maşa ile sürekli köz ayarı yapmak zorunda kalabilirsiniz.

Metal lüleler: Genellikle alüminyumdan üretilir. Isıyı çok hızlı iletir ama kömürdeki ısı değişimlerinden anında etkilenir; sürekli köz ekleyip azaltmanıza, tütünün hızlı yanmasına ve acı tat gelmesine yol açabilir. Isı yönetimi zor olduğu için profesyonel içimlerde pek tavsiye edilmez.

Cam lüleler: İnce cam modellerde ısı kontrolü zordur, tütünün yanma riski yüksektir. Quasar gibi markaların kalın cam çukurlu ve kalın silikon gövdeli setleri ise istisnadır: silikon gövde fazla ısıyı emer, kapaklı özel közlük ısıyı dengede tutar. Konforlu ve yüksek aromalı bir içim arayanlar için en doğru tercihlerden biridir.

Toptan veya perakende lüle siparişleriniz için katalogdaki toprak, taş, seramik, sırlı, sırsız, Phunnel ve Killer seçeneklerini inceleyerek içim tarzınıza ve bütçenize en uygun modeli seçebilirsiniz.`,
    },
  ],
};

export const ARTICLES: Article[] = [LULE_GUIDE];

export const articleHref = (article: Article) => `${BLOG_HREF}/${article.slug}`;
export const LULE_GUIDE_HREF = articleHref(LULE_GUIDE);

const BY_LOCALE: Record<Locale, Article[]> = { tr: ARTICLES, en: [LULE_GUIDE_EN], ar: [LULE_GUIDE_AR] };

/** The articles in a language, in the Turkish order. */
export const articles = (locale: Locale): Article[] => BY_LOCALE[locale];

/** One article by its (Turkish) slug, in a language. */
export const article = (slug: string, locale: Locale): Article | undefined =>
  BY_LOCALE[locale].find((a) => a.slug === slug);
