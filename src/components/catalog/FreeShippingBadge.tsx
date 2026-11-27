"use client";

import { Truck } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { useSharedStoreParameters } from "@/hooks/useLoyaltyBand";
import { showsFreeShipping } from "@/lib/freeShippingBadge";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { retailPerks } from "@/lib/perks";
import { useAuthStore } from "@/store/useAuthStore";
import type { Product } from "@/types";

/** A compact white pill with an emerald truck; crisp on any photo, either theme. */
const PILL =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-600/20 backdrop-blur-md";
const SIZES = {
  card: "@max-[13rem]:gap-1 @max-[13rem]:px-2 @max-[13rem]:text-[10px]",
  page: "px-3 py-1.5 text-xs",
};

/**
 * "Kargo Bedava" on a product photo, at the top end corner (lib/freeShippingBadge
 * has the rule and the corners). Nothing at all when it does not apply, so a
 * card without it keeps its layout.
 */
export function FreeShippingBadge({
  product,
  priceInclTax,
  dealLive,
  size = "card",
  className = "",
}: {
  product: Product;
  priceInclTax: string | null | undefined;
  dealLive: boolean;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const params = useSharedStoreParameters();
  const user = useAuthStore((s) => s.user);
  const label = useMessages(catalogMessages).card.freeShipping;
  const shown = showsFreeShipping({
    product,
    priceInclTax,
    dealLive,
    threshold: params.free_shipping_threshold,
    perks: !user || retailPerks(user),
  });
  if (!shown) return null;
  return (
    <span data-badge="free-shipping" className={`${PILL} ${SIZES[size]} ${className}`}>
      <Truck className={size === "page" ? "h-3.5 w-3.5" : "h-3 w-3"} strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}
