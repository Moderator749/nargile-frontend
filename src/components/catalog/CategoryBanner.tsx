import Image from "next/image";

import { canOptimiseImage } from "@/lib/home";

/**
 * A category's banner under its heading: a slim strip the width of the page's
 * column, 96px high on a phone, 112px from `sm`, 128px from `md` — a ribbon
 * over the grid, never a hero that pushes the products below the fold. The
 * image fills it from the middle (a 6:1 upload loses a little of its sides on
 * a phone and of its top and bottom on a wide screen; the panel says where
 * to keep the words). Its box is sized before the image arrives, so nothing
 * below it jumps; it is the page's first large image, so it is fetched first.
 * Rendered only when the category has one.
 */
export function CategoryBanner({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mb-5 h-24 w-full overflow-hidden rounded-xl bg-muted sm:h-28 md:h-32">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        // The column beside the category list from `lg`, the page's width below.
        sizes="(min-width: 1280px) 960px, (min-width: 1024px) 75vw, 100vw"
        unoptimized={!canOptimiseImage(src)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
