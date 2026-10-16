"use client";

import Image from "next/image";

import { ShowcaseProductCard, useOwnPrices } from "@/components/home/ShowcaseProductCard";
import { PAGE_CONTAINER } from "@/lib/layout";
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

/**
 * "Markalarımız": the house brand on the left — its name and logo — and its
 * products on the right as a row that scrolls sideways, four in view on a
 * desktop. Stacked below `lg`. The cards are the homepage's caption cards
 * (`ShowcaseProductCard`), re-priced for a signed-in visitor.
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
        <h2
          id="markalarimiz-baslik"
          className="mt-2 mb-6 text-3xl font-extrabold text-gray-900 md:text-4xl dark:text-white"
        >
          SULTAN NARGİLE
        </h2>
        {/* Dark ink on transparency; on the dark theme it is inverted with its
            red turned back to red, as the header's wordmark is. */}
        <Image
          src="/images/logo.png"
          alt="Sultan Nargile"
          width={250}
          height={33}
          className="h-auto w-[250px] max-w-full object-contain dark:hue-rotate-180 dark:invert dark:saturate-[2.5]"
        />
      </div>

      <div className="w-full overflow-hidden lg:col-span-9">
        <ul className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((listed) => (
            <li key={listed.id} className={SLIDE}>
              <ShowcaseProductCard
                product={mine?.get(listed.id) ?? listed}
                publicPrices={!mine}
                sizes="(min-width: 1024px) 18vw, (min-width: 768px) 30vw, 70vw"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
