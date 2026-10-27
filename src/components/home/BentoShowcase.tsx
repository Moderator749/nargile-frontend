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
 * "Görsel Vitrin", over the deals, "Görsel Vitrin 2", between SultanPuan and
 * Kumbara, and "Görsel Vitrin 3", under the deals: three 3:2 photo boxes side
 * by side, each a link with words on it placed as the admin placed them
 * (BentoBoxView). One under another on a phone, never wider than 26rem. No top
 * padding for the first two: the loyalty band above each by default already
 * ends in white space.
 */
export async function BentoShowcase({ copy, slot = "bento" }: { copy: HomeBento; slot?: "bento" | "bento2" | "bento3" }) {
  const t = (await getMessages(homeMessages))[slot];
  // A photo box with no photo, or one added and never titled past "Yeni kutu", is not shown.
  const boxes = copy.boxes.filter((box) => box.image?.trim() && !(box.title && isPlaceholderTitle(box.title)));
  if (boxes.length === 0) return null;
  return (
    <section
      aria-label={t.label}
      // The third stands under the deals' dark band, not a white one: it keeps the
      // campaign boxes' room above and below.
      className={`w-full bg-white dark:bg-transparent ${slot === "bento3" ? "py-10 md:py-12" : "pb-10 md:pb-14"}`}
    >
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
