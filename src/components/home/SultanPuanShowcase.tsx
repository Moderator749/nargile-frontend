"use client";

import { FIGURE, GOLD } from "@/components/home/GoldCoinBadge";
import { GoldShowcase } from "@/components/home/GoldShowcase";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { homeMessages } from "@/lib/i18n/messages/home";
import type { Category, SultanPuanShowcase as Showcase } from "@/types";

const whole = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

/** "20000.00"–"29999.99" → "20.000–29.999 TL": whole liras, the band's inside. */
export function bandText(min: string, max: string): string {
  return `${whole.format(Math.ceil(Number(min)))}–${whole.format(Math.floor(Number(max)))} TL`;
}

/** "10.00" → "%10", "2.50" → "%2,5" (Turkish; the band shows `percent` in the page's language). */
export function rateText(percent: string): string {
  return `%${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(Number(percent))}`;
}

/**
 * "%10 SultanPuan": the loyalty programme's own band on the homepage
 * (`GoldShowcase`) — the rate and the band it is earned in, both live from
 * "Parametreler", "Kazanan Siz Olun!" by the coin, and every product whose
 * price alone lands an order in that band.
 */
export function SultanPuanShowcase({ showcase, categories }: { showcase: Showcase; categories: Category[] }) {
  const t = useMessages(homeMessages);
  if (!showcase.enabled) return null;
  return (
    <GoldShowcase
      title={
        <>
          <span className={`${FIGURE} ${GOLD} text-3xl md:text-4xl`}>{t.percent(Number(showcase.rate_percent))}</span>
          <span className="text-2xl font-extrabold tracking-tight text-amber-950 md:text-3xl dark:text-amber-100">
            SultanPuan
          </span>
        </>
      }
      subtitle={t.loyalty.sultanPuanBand(bandText(showcase.band_min, showcase.band_max))}
      note={t.loyalty.sultanPuanNote}
      call={t.loyalty.sultanPuanCall}
      products={showcase.products}
      categories={categories}
      // Light grey, as "Fırsatları Kaçırma" and the Kumbara band.
      tone="silver"
    />
  );
}
