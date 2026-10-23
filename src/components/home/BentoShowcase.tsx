import Link from "@/components/i18n/Link";
import { BentoBoxView } from "@/components/home/BentoBoxView";
import { homeMessages } from "@/lib/i18n/messages/home";
import { getMessages } from "@/lib/i18n/server";
import { PAGE_CONTAINER } from "@/lib/layout";
import { isPlaceholderTitle } from "@/lib/showcase";
import type { HomeBento } from "@/types";

/*
 * How wide a photo to fetch: the box's width — a third of the container from
 * `md`, the screen (26rem at most) below — and a little over, since the shop's
 * wide photos (1.6:1) are cropped into the 3:2 box by their height.
 */
const SIZES = "(min-width: 768px) 36vw, 448px";

/**
 * "Görsel Vitrin", over the deals: three 3:2 photo boxes side by side, each
 * a link with words on it placed as the admin placed them (BentoBoxView). One
 * under another on a phone, never wider than 26rem. No top padding: the
 * Kumbara band above already ends in white space.
 */
export async function BentoShowcase({ copy }: { copy: HomeBento }) {
  const t = (await getMessages(homeMessages)).bento;
  // A photo box with no photo, or one added and never titled past "Yeni kutu", is not shown.
  const boxes = copy.boxes.filter((box) => box.image?.trim() && !(box.title && isPlaceholderTitle(box.title)));
  if (boxes.length === 0) return null;
  return (
    <section aria-label={t.label} className="w-full bg-white pb-10 md:pb-14 dark:bg-transparent">
      <ul className={`${PAGE_CONTAINER} grid grid-cols-1 gap-4 md:grid-cols-3`}>
        {boxes.map((box, i) => (
          <li key={i} className="max-md:mx-auto max-md:w-full max-md:max-w-[26rem]">
            <Link
              href={box.href}
              className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <BentoBoxView box={box} sizes={SIZES} className="ring-1 ring-black/5 dark:ring-white/10" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
