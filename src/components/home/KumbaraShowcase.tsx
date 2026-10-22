"use client";

import { FIGURE, GOLD } from "@/components/home/GoldCoinBadge";
import { GoldShowcase } from "@/components/home/GoldShowcase";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useStoreParameters } from "@/hooks/useStoreParameters";
import { homeMessages } from "@/lib/i18n/messages/home";
import { fillIn } from "@/lib/homeSectionCopy";
import type { CatalogProduct, Category, HomeLoyaltyCopy } from "@/types";

const whole = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

/**
 * "Kumbara 20.000 TL": the annual Sultan Puan bonus (formerly Kumbarapuan)
 * as its own band, the SultanPuan band's twin (`GoldShowcase`, in its light
 * grey tone), over the Marpuçlar category.
 *
 * The target and the bonus are the live ones from "Parametreler": the target
 * is `annual_spend_threshold`, and the "%5" is the bonus points' worth as a
 * share of it (1.000 puan × 1 TL on 20.000 TL). With Sultan Puan or the bonus
 * switched off in the panel, the band is not shown at all.
 */
export function KumbaraShowcase({
  products,
  categories,
  copy,
}: {
  products: CatalogProduct[];
  categories: Category[];
  /** Its words, from "Ana Sayfa Düzenleme"; {tutar} is the live target, {oran} the bonus. */
  copy: HomeLoyaltyCopy;
}) {
  const { loyalty } = useStoreParameters();
  const t = useMessages(homeMessages);
  const target = Number(loyalty.annual_spend_threshold);
  if (!loyalty.enabled || loyalty.annual_bonus_points <= 0 || target <= 0) return null;

  const amount = `${whole.format(target)} TL`;
  // As formatRate has it ("%5"), in the page's language ("5%" in English and Arabic).
  const bonus = t.percent(((loyalty.annual_bonus_points * Number(loyalty.conversion_rate)) / target) * 100);

  return (
    <GoldShowcase
      title={
        <>
          <span className="text-2xl font-extrabold tracking-tight text-amber-950 md:text-3xl dark:text-amber-100">
            Kumbara
          </span>
          <span className={`${FIGURE} ${GOLD} text-3xl md:text-4xl`}>{amount}</span>
        </>
      }
      subtitle={copy.subtitle}
      note={fillIn(copy.note, { tutar: amount, oran: bonus })}
      call={copy.call}
      products={products}
      categories={categories}
      // Light grey, as "Fırsatları Kaçırma" and the SultanPuan band.
      tone="silver"
    />
  );
}
