import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface AsidePromo {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  cta: string;
}

/**
 * Placeholders until "Ana Sayfa Düzenleme" manages these two: fixed copy,
 * linking to the two categories they name.
 */
const PROMOS: AsidePromo[] = [
  {
    eyebrow: "Közün Kalitesi",
    title: "Nargile Kömürü",
    text: "Sultan ve hindistan cevizi kömürleri, toptan ve perakende.",
    href: "/catalog/komurler",
    cta: "Kömürleri incele",
  },
  {
    eyebrow: "Yeni Sezon",
    title: "Marpuç Koleksiyonu",
    text: "Silikon, deri ve yıkanabilir marpuçlar, her takıma uygun.",
    href: "/catalog/marpuclar",
    cta: "Koleksiyona git",
  },
];

/**
 * The two promo boxes beside the hero, stacked to its height. They are there
 * only while the category column is closed and only from `lg`: opening the
 * column folds this column away (the row's grid takes its width to 0) and the
 * boxes fade out with it, so the slider keeps the rest of the row.
 *
 * `h-0 min-h-full`: the column takes the slider's height and gives the row
 * none of its own — folded to no width, its text would otherwise stand a
 * letter wide and stretch the slider down the page.
 */
export function HeroAside() {
  return (
    <aside
      aria-label="Öne çıkanlar"
      className="invisible hidden min-w-0 flex-col gap-4 overflow-hidden opacity-0 lg:h-0 lg:min-h-full transition-[opacity,visibility] duration-300 motion-reduce:transition-none lg:flex sidebar-closed:visible sidebar-closed:opacity-100"
    >
      {PROMOS.map((promo) => (
        <Link
          key={promo.href}
          href={promo.href}
          className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm shadow-black/[0.04] ring-1 ring-inset ring-black/[0.04] transition-shadow duration-300 hover:shadow-xl hover:shadow-black/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]"
        >
          {/* A faint warmth in the corner, the shop's red at a whisper. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgb(185_28_28/0.10),transparent_70%)] transition-transform duration-500 motion-safe:group-hover:scale-125"
          />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-700 dark:text-red-400">
              {promo.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
              {promo.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">{promo.text}</p>
          </div>
          <span className="relative mt-4 inline-flex w-max items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-red-700 dark:bg-white dark:text-gray-900 dark:group-hover:bg-red-600 dark:group-hover:text-white">
            {promo.cta}
            <ArrowRight className="h-3.5 w-3.5 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
      ))}
    </aside>
  );
}
