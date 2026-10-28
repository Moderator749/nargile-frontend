"use client";

import { BadgeCheck, Coins, Handshake, Truck, type LucideIcon } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { useShippingPerks } from "@/hooks/useShippingPerks";
import { useStoreParameters } from "@/hooks/useStoreParameters";
import { homeMessages } from "@/lib/i18n/messages/home";

/**
 * The advantages card's three short lines, each true of the shop as it is
 * set today: genuine products; free shipping over the live threshold and the
 * SultanPuan rate ("Parametreler") — or, for a signed-in B2B account, which
 * neither applies to, its own wholesale prices.
 */
export function AdvantageFeatures() {
  const t = useMessages(homeMessages);
  const params = useStoreParameters();
  const { show, thresholdTl } = useShippingPerks();
  const rate = Number(params.loyalty.base_rate) * 100;

  const items: { Icon: LucideIcon; text: string }[] = [{ Icon: BadgeCheck, text: t.aside.featureOriginal }];
  if (show) {
    items.push({ Icon: Truck, text: t.aside.featureShipping(thresholdTl) });
    if (params.loyalty.enabled && rate > 0) items.push({ Icon: Coins, text: t.aside.featureLoyalty(t.percent(rate)) });
  } else {
    items.push({ Icon: Handshake, text: t.aside.featureWholesale });
  }

  return (
    <ul className="space-y-1.5">
      {items.map(({ Icon, text }) => (
        <li key={text} className="flex items-center gap-2.5 text-[13px] font-medium leading-snug text-white/85">
          <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-300/15 text-amber-300 ring-1 ring-inset ring-amber-300/25">
            <Icon className="h-3 w-3" strokeWidth={2.5} />
          </span>
          {text}
        </li>
      ))}
    </ul>
  );
}
