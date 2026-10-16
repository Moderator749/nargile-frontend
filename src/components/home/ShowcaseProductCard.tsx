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

/**
 * A homepage product as a photo and a caption, with no card around them: the
 * photo on the section's own background, the brand, the name and the price
 * beneath it. Shared by "Sizin İçin Seçtiklerimiz" and "Markalarımız".
 */
export function ShowcaseProductCard({
  product,
  publicPrices,
  sizes,
}: {
  product: CatalogProduct;
  /** The price is the guest's (retail) one; masked for a signed-in visitor. */
  publicPrices: boolean;
  sizes: string;
}) {
  const money = useDisplayMoney();
  const price = displayVariant(product)?.price ?? null;

  return (
    <Link
      href={productHref(product)}
      className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900 dark:focus-visible:outline-white"
    >
      {/* No surface of its own in the light theme. On the dark one the photo still
          needs a light one: it is multiplied into what is behind it, and over
          black it would go black. */}
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-transparent p-6 dark:bg-zinc-100">
        <ProductImage
          src={product.image_url}
          alt={productImageAlt(product)}
          sizes={sizes}
          surfaceClassName="w-full bg-transparent"
          imageClassName="object-contain mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
          fallback={<Package className="h-10 w-10 text-gray-300" strokeWidth={1} aria-hidden />}
        />
      </div>
      <div className="mt-4 flex flex-col gap-1 text-left">
        {product.brand && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 md:text-xs dark:text-neutral-400">
            {product.brand.toLocaleUpperCase("tr-TR")}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 group-hover:underline dark:text-white">
          {product.name}
        </h3>
        <p
          className={`mt-1 w-fit text-lg font-bold text-gray-900 dark:text-white ${publicPrices ? "public-price" : ""}`}
        >
          <span>{price ? money.format(price) : "—"}</span>
        </p>
      </div>
    </Link>
  );
}
