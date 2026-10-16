"use client";

import { useId, useState } from "react";

const PARAGRAPH = "text-sm leading-relaxed text-gray-600 md:text-base dark:text-zinc-400";

/** In order; the first is shown, the rest wait behind "Devamını Oku". Add a paragraph here and it folds in with them. */
const PARAGRAPHS = [
  "Geleneksel nargile kültürünü modern mühendislikle buluşturan NargileMalzemesi, birinci sınıf paslanmaz çelik nargile takımları, premium lüle çeşitleri ve yüksek kaliteli nargile kömürleri ile sektörün öncüsüdür. Sultan Nargile, Oduman ve Legend Hookah gibi dünya standartlarındaki markaları tek bir çatı altında sunuyoruz.",
  "Bireysel nargile severler için kusursuz bir içim deneyimi sunarken, kafeler ve işletmeler için toptan nargile malzemeleri tedariğinde güvenilir çözüm ortağınızız. Hızlı kargo, orijinal ürün garantisi ve otomatik ciro indirimleriyle, ihtiyacınız olan tüm profesyonel aksesuarlar güvenle kapınızda.",
];

/**
 * The page's one passage of plain Turkish about the business, set like a
 * magazine standfirst: a short centred column, a heading, the first paragraph,
 * and "Devamını Oku" for the rest.
 *
 * The rest is folded, not left out: every paragraph is in the markup from the
 * server, there to be read by a crawler as much as by a visitor, and the fold
 * only hides it from view (and from the keyboard and screen readers while
 * shut). It opens by easing its height from nothing to its own.
 */
export function SeoIntro() {
  const [open, setOpen] = useState(false);
  const moreId = useId();
  const [first, ...rest] = PARAGRAPHS;

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
      <p className={PARAGRAPH}>{first}</p>

      {rest.length > 0 && (
        <>
          <div
            id={moreId}
            inert={!open}
            className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              {rest.map((text, i) => (
                <p key={i} className={`mt-4 ${PARAGRAPH}`}>
                  {text}
                </p>
              ))}
            </div>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={moreId}
            onClick={() => setOpen((value) => !value)}
            className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-red-400 dark:hover:text-red-300"
          >
            {open ? "Daralt" : "Devamını Oku"}
            <span aria-hidden>{open ? "↑" : "↓"}</span>
          </button>
        </>
      )}
    </section>
  );
}
