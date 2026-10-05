"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Package, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/useCartStore";
import type { CatalogProduct } from "@/types";

interface ProductCardProps {
  product: CatalogProduct;
  isLoggedIn: boolean;
}

export function ProductCard({ product, isLoggedIn }: ProductCardProps) {
  const variant = product.variants[0];
  const price = variant?.price ?? null;
  const listPrice = variant?.list_price ?? null;
  const hasDiscount =
    !!price && !!listPrice && Number(price.price_incl_tax) < Number(listPrice.price_incl_tax);

  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function handleAdd() {
    if (!variant || !price) return;
    useCartStore.getState().addItem({
      variant_id: variant.id,
      quantity: 1,
      product_name: product.name,
      price: (listPrice ?? price).price_incl_tax,
      segment_price: isLoggedIn ? price.price_incl_tax : null,
    });
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* The backend has no product images yet, so every card uses the placeholder. */}
      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
        <Package className="h-12 w-12" strokeWidth={1.25} aria-hidden />
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {product.brand}
          </p>
        )}
        <h2 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-900">
          {product.name}
        </h2>

        <div className="mt-3 flex items-baseline gap-2">
          {price ? (
            <>
              <span className="text-lg font-bold text-slate-900">{formatPrice(price)}</span>
              {hasDiscount && listPrice && (
                <span className="text-sm text-slate-400 line-through">{formatPrice(listPrice)}</span>
              )}
            </>
          ) : (
            <span className="text-sm text-slate-500">Fiyat bilgisi yok</span>
          )}
        </div>
        {hasDiscount && (
          <p className="mt-1 text-xs font-medium text-emerald-600">Size özel fiyat</p>
        )}

        <div className="mt-auto pt-4">
          <Button type="button" onClick={handleAdd} disabled={!price}>
            {added ? (
              <>
                <Check className="h-4 w-4" aria-hidden /> Sepete eklendi
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" aria-hidden /> Sepete Ekle
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
