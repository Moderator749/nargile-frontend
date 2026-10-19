"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

import { ProductCard } from "@/components/catalog/ProductCard";
import { fetchFlashSaleProducts } from "@/lib/catalogApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { CatalogProduct, Category } from "@/types";

const GRID = "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4";
/** The first row on a wide screen loads at once; the rest lazily. */
const EAGER_CARDS = 4;

/** A deal that can still be claimed in some colour — the funnel's own rule. */
const live = (p: CatalogProduct) => p.is_opportunity && p.variants.some((v) => v.flash_sale);

/**
 * "Fırsat Ürünleri" (/firsat-urunleri): every live deal as a catalog card, the
 * page the homepage funnel's "Fırsatları Gör" leads to.
 *
 * Server-rendered at public (retail) prices; a signed-in visitor's own copies
 * replace them — their price and their own list's stock — and until they do,
 * or if they never arrive, the cards stay masked and unbuyable rather than
 * show the guest's.
 */
export function DealsGrid({
  initialProducts,
  categories,
}: {
  initialProducts: CatalogProduct[];
  categories: Category[];
}) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [own, setOwn] = useState<{ token: string; products: CatalogProduct[] | null } | null>(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchFlashSaleProducts(controller.signal)
      .then((products) => setOwn({ token, products }))
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setOwn({ token, products: null });
      });
    return () => controller.abort();
  }, [hydrated, token]);

  const loggedIn = hydrated && !!token;
  const mine = own && own.token === token ? own.products : null;
  const pricesPending = loggedIn && !mine;
  const products = (mine ?? initialProducts).filter(live);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-base font-semibold text-foreground">Şu anda aktif bir fırsat yok.</p>
        <p className="mt-1 text-sm text-muted-foreground">Yeni fırsatlar eklendiğinde burada listelenecek.</p>
        <Link
          href="/catalog"
          className="mt-5 text-sm font-medium text-foreground underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
        >
          Tüm ürünlere göz atın
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-5 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
        {products.length} fırsat ürünü
      </h2>
      <ul className={GRID}>
        {products.map((product, i) => (
          <li key={product.id} className="flex">
            <div className="flex w-full flex-col [&>article]:flex-1">
              <ProductCard
                product={product}
                eager={i < EAGER_CARDS}
                category={product.category_id != null ? categoryById.get(product.category_id) : undefined}
                isLoggedIn={loggedIn}
                publicPrices={!mine}
                pricesPending={pricesPending}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
