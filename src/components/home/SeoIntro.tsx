/**
 * The page's one passage of plain Turkish about the business, set like a
 * magazine standfirst: a short centred column, a heading, two paragraphs. It
 * is in the markup as ordinary prose, there to be read by a crawler as much
 * as by a visitor — the shop, what it sells, the brands, who it sells to.
 */
export function SeoIntro() {
  return (
    <section
      id="seo-intro"
      aria-labelledby="seo-intro-heading"
      className="mx-auto max-w-4xl bg-transparent px-4 py-16 text-center"
    >
      <h2
        id="seo-intro-heading"
        className="mb-6 text-balance text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl dark:text-white"
      >
        Türkiye&apos;nin Lider Nargile Malzemeleri ve Toptan Tedarikçisi
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-gray-600 md:text-base dark:text-zinc-400">
        Geleneksel nargile kültürünü modern mühendislikle buluşturan NargileMalzemesi, birinci sınıf paslanmaz çelik
        nargile takımları, premium lüle çeşitleri ve yüksek kaliteli nargile kömürleri ile sektörün öncüsüdür. Sultan
        Nargile, Oduman ve Legend Hookah gibi dünya standartlarındaki markaları tek bir çatı altında sunuyoruz.
      </p>
      <p className="text-sm leading-relaxed text-gray-600 md:text-base dark:text-zinc-400">
        Bireysel nargile severler için kusursuz bir içim deneyimi sunarken, kafeler ve işletmeler için toptan nargile
        malzemeleri tedariğinde güvenilir çözüm ortağınızız. Hızlı kargo, orijinal ürün garantisi ve otomatik ciro
        indirimleriyle, ihtiyacınız olan tüm profesyonel aksesuarlar güvenle kapınızda.
      </p>
    </section>
  );
}
