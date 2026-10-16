"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ShowcaseProductCard, useOwnPrices } from "@/components/home/ShowcaseProductCard";
import { PAGE_CONTAINER } from "@/lib/layout";
import { brandHref } from "@/lib/seo";
import type { CatalogProduct } from "@/types";

/**
 * Four across from `lg` and three from `md`, each width short by its share of
 * the 1.5rem gaps (three gaps between four, two between three); 70% of the
 * viewport on a phone, so the next card shows at the edge. Set as the width as
 * well as the minimum: a flex item otherwise grows to its longest product name
 * on one line, and four no longer fit.
 */
const SLIDE = [
  "flex shrink-0 snap-start flex-col",
  "w-[70vw] min-w-[70vw] md:w-[calc(33.333%-1rem)] md:min-w-[calc(33.333%-1rem)]",
  "lg:w-[calc(25%-1.125rem)] lg:min-w-[calc(25%-1.125rem)]",
].join(" ");

/** The house brand's own page: every product carrying its name. */
const COLLECTION_HREF = brandHref("sultan");

/**
 * "Markalarımız": the house brand on the left — its logo, a line on what it
 * stands for and the way into its collection — and its products on the right
 * as a row of boxed cards that scrolls sideways, four in view on a desktop.
 * Stacked below `lg`. The cards are re-priced for a signed-in visitor.
 */
export function BrandShowcase({ products }: { products: CatalogProduct[] }) {
  const mine = useOwnPrices(products);
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="markalarimiz-baslik"
      className={`${PAGE_CONTAINER} my-16 grid grid-cols-1 items-center gap-8 lg:grid-cols-12`}
    >
      <div className="flex flex-col items-start lg:col-span-3">
        <p className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">Markalarımız</p>
        {/* The logo is the heading: it already says the name, so no text
            repeats it on screen. Dark ink on transparency; on the dark theme
            it is inverted with its red turned back to red, as the header's
            wordmark is. */}
        <h2 id="markalarimiz-baslik" className="mt-4 w-full">
          <Image
            src="/images/logo.png"
            alt="Sultan Nargile"
            width={280}
            height={37}
            className="h-auto w-[280px] max-w-full object-contain dark:hue-rotate-180 dark:invert dark:saturate-[2.5]"
          />
        </h2>
        <p className="mt-4 mb-6 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
          Geleneksel nargile zanaatını modern mühendislikle buluşturan Sultan Nargile; dayanıklı çelik takımları,
          tescilli aksesuarları ve benzersiz içim kalitesiyle sektör standartlarını belirliyor.
        </p>
        <Link
          href={COLLECTION_HREF}
          className="inline-flex items-center gap-2 rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Koleksiyonu Keşfet
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="w-full overflow-hidden lg:col-span-9">
        {/* The top padding keeps the cards' shadow from being clipped: a
            sideways scroller clips vertically too. */}
        <ul className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pt-2 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((listed) => (
            <li key={listed.id} className={SLIDE}>
              <ShowcaseProductCard
                product={mine?.get(listed.id) ?? listed}
                publicPrices={!mine}
                sizes="(min-width: 1024px) 18vw, (min-width: 768px) 30vw, 70vw"
                boxed
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
