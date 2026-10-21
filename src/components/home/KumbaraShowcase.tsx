"use client";

import { FIGURE, GOLD } from "@/components/home/GoldCoinBadge";
import { GoldShowcase } from "@/components/home/GoldShowcase";
import { useStoreParameters } from "@/hooks/useStoreParameters";
import { formatRate } from "@/lib/storeParameters";
import type { CatalogProduct, Category } from "@/types";

const whole = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

/**
 * "Kumbara 20.000 TL": the annual Sultan Puan bonus (formerly Kumbarapuan)
 * as its own gold band, the SultanPuan band's twin (`GoldShowcase`), over the
 * Marpuçlar category.
 *
 * The target and the bonus are the live ones from "Parametreler": the target
 * is `annual_spend_threshold`, and the "%5" is the bonus points' worth as a
 * share of it (1.000 puan × 1 TL on 20.000 TL). With Sultan Puan or the bonus
 * switched off in the panel, the band is not shown at all.
 */
export function KumbaraShowcase({ products, categories }: { products: CatalogProduct[]; categories: Category[] }) {
  const { loyalty } = useStoreParameters();
  const target = Number(loyalty.annual_spend_threshold);
  if (!loyalty.enabled || loyalty.annual_bonus_points <= 0 || target <= 0) return null;

  const amount = `${whole.format(target)} TL`;
  const bonus = formatRate((loyalty.annual_bonus_points * Number(loyalty.conversion_rate)) / target);

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
      subtitle="Az ya da çok, her alışverişe SultanPuan"
      note={`Toplam ${amount} barajına ulaşın, ekstra ${bonus} KumbaraPuan kazanın.`}
      call="Birikim Yapın!"
      products={products}
      categories={categories}
    />
  );
}
