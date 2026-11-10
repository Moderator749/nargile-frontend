/**
 * The 11.11 campaign's banner on the homepage, and how long it stays: through
 * 15 November 2026, 23:59:59 in Istanbul (UTC+3, no daylight saving), and
 * not a moment after. The homepage is rendered per request, so the banner is
 * gone from the first visit past that second, with no deploy.
 */
export const CAMPAIGN_BANNER = {
  src: "/images/11kasim_indirim_3.png",
  alt: "11.11 Fırsatları - Seçili Ürünlerde Büyük İndirim",
  endsAt: Date.parse("2026-11-15T23:59:59.999+03:00"),
} as const;

/** Whether the campaign's banner is still up at `now` (ms since the epoch). */
export function campaignBannerLive(now: number = Date.now()): boolean {
  return now <= CAMPAIGN_BANNER.endsAt;
}
