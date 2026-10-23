"use client";

import { Fragment } from "react";

import { CourierPerks } from "@/components/home/CourierPerks";
import { ProductRow } from "@/components/home/ProductRow";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category, HomeLules } from "@/types";

/**
 * "Lüle Alırken Kararsız Kalacaksınız": the Lüleler category as one sliding
 * row of products, the same row as "Sizin İçin Seçtiklerimiz" above it and
 * on the same white. The courier perk sits in its header, beside the title,
 * with the courier driving (`CourierPerks`); the cards are flat, their edge
 * turning red on hover (`accent`).
 * Server-rendered at the public price, re-priced for a signed-in visitor.
 */

/**
 * "Sırlı & Sırsız | Phunnel & Killer | … | Aradığınız tüm lüle marka ve
 * modelleri burada". Each pair is kept whole with its divider after it (a
 * no-break space before the "|"), so a narrow screen breaks only after a
 * divider: never inside a pair, and no line starts with a "|". The dividers
 * are a shade lighter than the words; the closing phrase wraps as text does,
 * but never leaves "burada" on a line of its own.
 */
function Subtitle({ kinds, closing }: { kinds: string[]; closing: string }) {
  return (
    <>
      {kinds.map((kind) => (
        <Fragment key={kind}>
          <span className="whitespace-nowrap">
            {kind}
            <span className="text-gray-300 dark:text-neutral-600">{"\u00a0|"}</span>
          </span>{" "}
        </Fragment>
      ))}
      {/* Its last two words held together (in the messages), so it never ends on one alone. */}
      {closing}
    </>
  );
}

export function LuleShowcase({
  products,
  categories,
  copy,
}: {
  products: CatalogProduct[];
  categories: Category[];
  /** Its words and its "Tüm Lüleleri Gör" link, from "Ana Sayfa Düzenleme". */
  copy: HomeLules;
}) {
  const mine = useOwnPrices(products);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);

  return (
    <ProductRow
      headingId="luleler-baslik"
      title={copy.title}
      subtitle={<Subtitle kinds={copy.kinds} closing={copy.closing} />}
      // The picks row's white, continued: the two read as a pair.
      className="bg-white pt-8 pb-12 sm:pt-10 sm:pb-16 dark:bg-transparent"
      actions={<CourierPerks eyebrow={copy.courier_eyebrow} text={copy.courier_text} />}
      products={products}
      mine={mine}
      loggedIn={hydrated && !!token}
      categories={categories}
      more={{ href: copy.href, label: copy.more }}
    />
  );
}
