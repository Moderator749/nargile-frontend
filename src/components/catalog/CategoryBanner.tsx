import Image from "next/image";

import { canOptimiseImage } from "@/lib/home";

/**
 * A category's banner under its heading, the width of the page's column: 4:1,
 * and 3:1 on a phone (cut from the middle, where the panel tells the admin to
 * keep the words), so it never shrinks to a sliver. Its box is sized before
 * the image arrives, so nothing below it jumps; it is the page's first large
 * image, so it is fetched first. Rendered only when the category has one.
 */
export function CategoryBanner({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mb-5 aspect-[3/1] overflow-hidden rounded-2xl bg-muted sm:aspect-[4/1]">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        // The column beside the category list from `lg`, the page's width below.
        sizes="(min-width: 1280px) 960px, (min-width: 1024px) 75vw, 100vw"
        unoptimized={!canOptimiseImage(src)}
        className="object-cover"
      />
    </div>
  );
}
