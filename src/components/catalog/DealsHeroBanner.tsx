import Image from "next/image";

/**
 * The 11.11 campaign's banner over Fırsat Ürünleri: the page's full width,
 * above Kategoriler and the heading. The photo is 4:1 (4000×1000) and its box
 * keeps that ratio, so a phone sees all of it, smaller (≈86px high at 375px);
 * from `md` the box stops at 260px high and the photo fills it from the
 * middle, losing at most a sliver of its top and bottom (≈8% each at the
 * widest container), never the words on its left. The box is sized before the
 * image arrives (no layout shift) and it is the page's largest image above
 * the fold, so it is preloaded.
 */
export function DealsHeroBanner() {
  return (
    <div className="relative mb-6 aspect-[4/1] w-full overflow-hidden rounded-2xl bg-muted md:mb-8 md:max-h-[260px]">
      <Image
        src="/images/11kasim_indirim_3.jpg"
        alt="11.11 Fırsatları - Seçili Ürünlerde Büyük İndirim"
        fill
        preload
        // The page container: 1280px less its 24px gutters, the screen below.
        sizes="(min-width: 1280px) 1232px, 100vw"
        className="object-cover object-center"
      />
    </div>
  );
}
