/**
 * The shop's articles: the four of the lüle guide from nargilemalzemesi.com,
 * each a post of its own (it was one guide, /blog/nargile-lule-rehberi, which
 * now forwards to the first — see next.config). The footer's blog column
 * links to them.
 *
 * Bodies use the `LegalText` format: blank lines between paragraphs and `## `
 * for a sub-heading.
 *
 * English and Arabic copies live in lib/content (blog.en, blog.ar), article for
 * article under the same slug; read them through `articles(locale)` and
 * `article(slug, locale)`.
 */

import { LULE_ARTICLES_AR } from "@/lib/content/blog.ar";
import { LULE_ARTICLES_EN } from "@/lib/content/blog.en";
import type { Locale } from "@/lib/i18n/config";

export const BLOG_HREF = "/blog";

export interface Article {
  /** Turkish in every language (/en/blog/nargile-lulesi-nedir). */
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  /** A lead paragraph over the body, when it has one. */
  intro?: string;
  body: string;
}

export const ARTICLES: Article[] = [
  {
    slug: "nargile-lulesi-nedir",
    title: "Nargile lülesi nedir, çeşitleri var mıdır?",
    description:
      "Nargile lülesi nedir, ne işe yarar ve hangi malzemelerden üretilir? Lüle çeşitlerine ve Phunnel ile Killer tasarımlarına kısa bir bakış.",
    datePublished: "2026-04-10",
    intro:
      "Nargile içim performansını ve aromasını belirleyen en önemli ekipmanların başında nargile lülesi gelir. Doğru lüleyi seçmek; dolum tekniğinden ısı yönetimine, içimin yumuşaklığından aromanın yoğunluğuna kadar her şeyi değiştirir.",
    body: `Lülenin temel işlevi, içine konan nargile tütününden ısı yardımıyla duman üretmektir. Lüleler genellikle 15–25 gram arası tütün kapasitesine sahiptir.

Günümüzde toprak, kil, taş ve seramik gibi geleneksel çamur türevlerinden üretilen sırlı veya sırsız modellerin yanı sıra cam, silikon ve metal malzemelerden üretilen modern seçenekler de mevcuttur. Tasarımlarına göre ise lüleler temel olarak Phunnel lüle ve Killer lüle olmak üzere iki ana kategoriye ayrılır.`,
  },
  {
    slug: "phunnel-ve-killer-lule-farki",
    title: "Phunnel ve Killer lüle arasındaki fark nedir?",
    description:
      "Phunnel ve Killer lüle arasındaki fark: hava akışı, dolum tekniği, duman yoğunluğu ve takım temizliği açısından iki tasarımın karşılaştırması.",
    datePublished: "2026-04-10",
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
    slug: "sirli-mi-sirsiz-mi-lule",
    title: "Sırlı lüle mi, sırsız lüle mi? Hangi lüleyi satın almalıyım?",
    description:
      "Sırlı ve sırsız lüle farkı: aroma bağlama, lülenin kusması, temizlik ve farklı aromalarla kullanım açısından hangi lüleyi seçmelisiniz?",
    datePublished: "2026-04-10",
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
    slug: "hangi-nargile-lulesini-almaliyim",
    title: "Hangi nargile lülesini satın almalıyım?",
    description:
      "Metal, cam, toprak ve seramik lüleler ısıyı nasıl yönetir? Malzemesine göre doğru nargile lülesini seçmek için pratik bir rehber.",
    datePublished: "2026-04-10",
    body: `Keyifli bir içim doğru ısı yönetimiyle başlar. Isıyı 1–2 dakika içinde ideal seviyeye getirmek ve içim boyunca sabit tutabilmek lülenin malzemesine bağlıdır. Doğru lüle seçilmediğinde elinizde maşa ile sürekli köz ayarı yapmak zorunda kalabilirsiniz.

Metal lüleler: Genellikle alüminyumdan üretilir. Isıyı çok hızlı iletir ama kömürdeki ısı değişimlerinden anında etkilenir; sürekli köz ekleyip azaltmanıza, tütünün hızlı yanmasına ve acı tat gelmesine yol açabilir. Isı yönetimi zor olduğu için profesyonel içimlerde pek tavsiye edilmez.

Cam lüleler: İnce cam modellerde ısı kontrolü zordur, tütünün yanma riski yüksektir. Quasar gibi markaların kalın cam çukurlu ve kalın silikon gövdeli setleri ise istisnadır: silikon gövde fazla ısıyı emer, kapaklı özel közlük ısıyı dengede tutar. Konforlu ve yüksek aromalı bir içim arayanlar için en doğru tercihlerden biridir.

Toptan veya perakende lüle siparişleriniz için katalogdaki toprak, taş, seramik, sırlı, sırsız, Phunnel ve Killer seçeneklerini inceleyerek içim tarzınıza ve bütçenize en uygun modeli seçebilirsiniz.`,
  },
];

export const articleHref = (article: Pick<Article, "slug">) => `${BLOG_HREF}/${article.slug}`;

const BY_LOCALE: Record<Locale, Article[]> = { tr: ARTICLES, en: LULE_ARTICLES_EN, ar: LULE_ARTICLES_AR };

/** The articles in a language, in the Turkish order. */
export const articles = (locale: Locale): Article[] => BY_LOCALE[locale];

/** One article by its (Turkish) slug, in a language. */
export const article = (slug: string, locale: Locale): Article | undefined =>
  BY_LOCALE[locale].find((a) => a.slug === slug);
