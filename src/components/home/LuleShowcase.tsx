"use client";

import { Fragment } from "react";

import { CourierPerks } from "@/components/home/CourierPerks";
import { ProductRow } from "@/components/home/ProductRow";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

/**
 * "Lüle Alırken Kararsız Kalacaksınız": the Lüleler category as one sliding
 * row of products, the same row as "Sizin İçin Seçtiklerimiz" above it and
 * on the same white. The courier perk sits in its header, beside the title,
 * with the courier driving (`CourierPerks`); the cards are flat, their edge
 * turning red on hover (`accent`).
 * Server-rendered at the public price, re-priced for a signed-in visitor.
 */
/** The kinds of lüle the shop carries, in pairs, before the closing phrase. */
const LULE_KINDS = ["Sırlı & Sırsız", "Phunnel & Killer", "Cam & Silikon", "Toprak & Seramik"];

/**
 * "Sırlı & Sırsız | Phunnel & Killer | … | Aradığınız tüm lüle marka ve
 * modelleri burada". Each pair is kept whole with its divider after it (a
 * no-break space before the "|"), so a narrow screen breaks only after a
 * divider: never inside a pair, and no line starts with a "|". The dividers
 * are a shade lighter than the words; the closing phrase wraps as text does,
 * but never leaves "burada" on a line of its own.
 */
const SUBTITLE = (
  <>
    {LULE_KINDS.map((kind) => (
      <Fragment key={kind}>
        <span className="whitespace-nowrap">
          {kind}
          <span className="text-gray-300 dark:text-neutral-600">{"\u00a0|"}</span>
        </span>{" "}
      </Fragment>
    ))}
    {/* Its last two words held together, so it never ends on one alone. */}
    {"Aradığınız tüm lüle marka ve modelleri\u00a0burada"}
  </>
);

export function LuleShowcase({
  products,
  categories,
  categoryHref,
}: {
  products: CatalogProduct[];
  categories: Category[];
  /** The Lüleler category's page, for "Tüm Lüleleri Gör". */
  categoryHref: string;
}) {
  const mine = useOwnPrices(products);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);

  return (
    <ProductRow
      headingId="luleler-baslik"
      title="Lüle Alırken Kararsız Kalacaksınız"
      subtitle={SUBTITLE}
      // The picks row's white, continued: the two read as a pair.
      className="bg-white pt-8 pb-12 sm:pt-10 sm:pb-16 dark:bg-transparent"
      actions={<CourierPerks />}
      products={products}
      mine={mine}
      loggedIn={hydrated && !!token}
      categories={categories}
      accent
      more={{ href: categoryHref, label: "Tüm Lüleleri Gör" }}
    />
  );
}
