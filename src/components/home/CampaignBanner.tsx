import Image from "next/image";

import Link from "@/components/i18n/Link";
import { CAMPAIGN_BANNER } from "@/lib/campaign";
import { DEALS_HREF } from "@/lib/flashSale";

/**
 * The 11.11 campaign's banner inside "Fırsatları Kaçırma", between its heading
 * and the deals, and a way to all of them (Fırsat Ürünleri). The photo is 4:1
 * (4000×1000) and its box keeps that ratio at every width, so nothing of it is
 * cut — the words run down to its bottom edge — ≈86px high on a phone, 308px
 * at the widest container. The box is sized before the image arrives (no
 * layout shift). It is not preloaded: the band sits well below the hero,
 * whose slide is the page's LCP and keeps the early bandwidth to itself.
 * The page decides whether it shows at all (lib/campaign).
 */
export function CampaignBanner() {
  return (
    <Link
      href={DEALS_HREF}
      className="group relative mt-6 block aspect-[4/1] w-full overflow-hidden rounded-2xl bg-muted shadow-lg shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
    >
      <Image
        src={CAMPAIGN_BANNER.src}
        alt={CAMPAIGN_BANNER.alt}
        fill
        // The page container: 1280px less its 24px gutters, the screen below.
        sizes="(min-width: 1280px) 1232px, 100vw"
        className="object-cover object-center transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.015]"
      />
    </Link>
  );
}
