"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { transferPriceFor } from "@/components/product/TransferPrice";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { formatPercent, productMessages } from "@/lib/i18n/messages/product";
import type { CatalogPrice, ExchangeRates, StoreParameters } from "@/types";

/**
 * The product's price as one small table, each way of paying on its own row:
 * Kart / Liste Fiyatı (with the price it was, where it is reduced), Havale /
 * EFT Fiyatı at this price's own transfer rate, and the installments the shop
 * offers — so the page states one transfer figure, for this product, rather
 * than a price, a struck price, a percentage and a second price in a heap.
 *
 * The havale row and the installments are retail promotions (`retail`): an
 * account on its own price list pays that whichever way it pays.
 */
export function PriceSummary({
  price,
  was,
  discount,
  retail,
  installments,
  params,
  rates,
  format,
}: {
  price: CatalogPrice;
  was: CatalogPrice | null;
  discount: number;
  retail: boolean;
  /** The homepage's installments line ("Peşin fiyatına 3 taksit"); null while it is not shown there. */
  installments: string | null;
  params: StoreParameters;
  rates: ExchangeRates | null;
  format: (price: CatalogPrice) => string;
}) {
  const locale = useLocale();
  const t = useMessages(productMessages).priceTable;
  const card = useMessages(catalogMessages).card;
  const transfer = retail ? transferPriceFor(price, params, rates) : null;
  const row = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3";
  const label = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  return (
    <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      <div className={row}>
        <dt className={label}>{t.card}</dt>
        <dd className="flex flex-wrap items-baseline gap-x-2.5 tabular-nums">
          {discount > 0 && was && (
            <>
              <span className="text-sm text-muted-foreground line-through">{format(was)}</span>
              <span className="text-xs font-bold text-accent">{card.discount(discount)}</span>
            </>
          )}
          <span className="text-2xl font-bold tracking-tight text-foreground">{format(price)}</span>
        </dd>
      </div>
      {transfer && (
        <div className={row}>
          <dt className={label}>
            {t.transfer} <span className="normal-case tracking-normal">({t.transferOff(formatPercent(transfer.rate, locale))})</span>
          </dt>
          <dd className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{format(transfer.price)}</dd>
        </div>
      )}
      {retail && installments && (
        <div className={row}>
          <dt className={label}>{t.installments}</dt>
          <dd className="text-sm font-semibold text-foreground">{installments}</dd>
        </div>
      )}
    </dl>
  );
}
