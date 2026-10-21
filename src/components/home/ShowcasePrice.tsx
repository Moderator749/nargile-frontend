"use client";

import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { saleState } from "@/lib/flashSale";
import { displayVariant } from "@/lib/variants";
import type { CatalogProduct } from "@/types";

/**
 * A product's price in the homepage's own bands ("Közlükler", "Oyun &
 * Eğlence"), as the product card shows it: the visitor's own copy when they are
 * signed in (`own`, from useOwnPrices), else the server's public one — masked
 * for a signed-in visitor until theirs arrives (`public-price`), so a dealer
 * never sees a retail figure flash. A live sale shows its price with the
 * regular one struck through.
 */
export function ShowcasePrice({
  product,
  own,
  prefix,
  className = "",
  wasClassName = "",
}: {
  product: CatalogProduct;
  own: Map<string, CatalogProduct> | null;
  /**
   * Words before the figure ("en uygun"); the struck-through price is left
   * out then. Never a suffix: Turkish would need "'den" or "'dan" by how the
   * number is read.
   */
  prefix?: string;
  className?: string;
  wasClassName?: string;
}) {
  const money = useDisplayMoney();
  const shown = own?.get(product.id) ?? product;
  const variant = displayVariant(shown);
  const sale = saleState(shown, variant, null);
  const regular = variant?.price ?? variant?.list_price ?? null;
  const price = sale.kind === "live" ? sale.price : regular;

  return (
    <span className={`inline-flex ${own ? "" : "public-price"}`}>
      <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
        {price ? (
          <>
            {prefix && <span className="font-sans font-normal">{prefix}</span>}
            <span className="tabular-nums">{money.format(price)}</span>
            {!prefix && sale.kind === "live" && regular && (
              <span className={`tabular-nums line-through ${wasClassName}`}>{money.format(regular)}</span>
            )}
          </>
        ) : (
          <span className="font-sans">Fiyat için iletişime geçin</span>
        )}
      </span>
    </span>
  );
}
