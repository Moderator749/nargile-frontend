"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Package } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { useDisplayMoney } from "@/hooks/useDisplayMoney";
import { fetchProductsByIds } from "@/lib/catalogApi";
import { productHref, productImageAlt } from "@/lib/seo";
import { displayVariant } from "@/lib/variants";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct } from "@/types";

/**
 * The signed-in visitor's own copies of these server-rendered products, priced
 * for their segment and fetched in one request; null for a guest, and until
 * that request answers. While it is null a signed-in visitor's prices stay
 * masked (`public-price`), never showing a figure that is not theirs.
 */
export function useOwnPrices(products: CatalogProduct[]): Map<string, CatalogProduct> | null {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [own, setOwn] = useState<{ token: string; byId: Map<string, CatalogProduct> } | null>(null);
  // Keyed on the ids, not the array: a caller may build it afresh every render.
  const ids = [...new Set(products.map((p) => p.id))].join(",");

  useEffect(() => {
    if (!hydrated || !token || !ids) return;
    const controller = new AbortController();
    fetchProductsByIds(ids.split(","), controller.signal)
      .then((found) => setOwn({ token, byId: new Map(found.map((p) => [p.id, p])) }))
      .catch((err: unknown) => {
        // Unpriced for this account is still better than a guest's price.
        if (!axios.isCancel(err)) setOwn({ token, byId: new Map() });
      });
    return () => controller.abort();
  }, [hydrated, token, ids]);

  return hydrated && token && own?.token === token ? own.byId : null;
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900 dark:focus-visible:outline-white";

/**
 * A homepage product: the photo, then the brand, the name and the price.
 *
 * Bare by default — no card at all, the photo on the section's own background
 * ("Sizin İçin Seçtiklerimiz"). `boxed` encloses all of it in a white card
 * with a hairline and a soft shadow that deepens on hover ("Markalarımız"),
 * stretched to the height of its row with the price kept at the bottom.
 */
export function ShowcaseProductCard({
  product,
  publicPrices,
  sizes,
  boxed = false,
}: {
  product: CatalogProduct;
  /** The price is the guest's (retail) one; masked for a signed-in visitor. */
  publicPrices: boolean;
  sizes: string;
  boxed?: boolean;
}) {
  const money = useDisplayMoney();
  const price = displayVariant(product)?.price ?? null;

  return (
    <Link
      href={productHref(product)}
      className={`group rounded-2xl ${FOCUS} ${
        boxed
          ? "flex h-full flex-col justify-between border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-border dark:bg-neutral-900"
          : "block"
      }`}
    >
      <div>
        {/* No surface of its own on white. On the dark theme the photo still
            needs a light one: it is multiplied into what is behind it, and
            over black it would go black. */}
        <div
          className={`relative flex aspect-square w-full items-center justify-center overflow-hidden bg-transparent dark:bg-zinc-100 ${
            boxed ? "rounded-xl p-4" : "rounded-2xl p-6"
          }`}
        >
          <ProductImage
            src={product.image_url}
            alt={productImageAlt(product)}
            sizes={sizes}
            surfaceClassName="w-full bg-transparent"
            imageClassName="object-contain mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
            fallback={<Package className="h-10 w-10 text-gray-300" strokeWidth={1} aria-hidden />}
          />
        </div>
        <div className={`${boxed ? "mt-3" : "mt-4"} flex flex-col gap-1 text-left`}>
          {product.brand && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 md:text-xs dark:text-neutral-400">
              {product.brand.toLocaleUpperCase("tr-TR")}
            </p>
          )}
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 group-hover:underline dark:text-white">
            {product.name}
          </h3>
        </div>
      </div>
      <p
        className={`w-fit font-bold text-gray-900 dark:text-white ${boxed ? "mt-2 text-base" : "mt-1 text-lg"} ${
          publicPrices ? "public-price" : ""
        }`}
      >
        <span>{price ? money.format(price) : "—"}</span>
      </p>
    </Link>
  );
}
