"use client";

import { useStoreParameters } from "@/hooks/useStoreParameters";
import { formatMoneyCompact } from "@/lib/format";
import { retailPerks } from "@/lib/perks";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";

/** "3000.00" → "3.000", "2999.90" → "2.999,9". */
const TL = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

/**
 * The shipping perks a promotional block may quote: free shipping over the
 * live threshold ("Parametreler", what checkout applies: `threshold` "₺3.000",
 * `thresholdTl` "3.000 TL") and İstanbul's same-day courier.
 *
 * Both are retail promises — free shipping over the threshold is a retail
 * perk at checkout, and the courier is offered as one on the product page —
 * so `show` is false for a signed-in B2B account, which would be promised what
 * checkout will not honour. A visitor, a retail customer and the panel's staff
 * see them, as the SultanPuan row's rule has it.
 */
export function useShippingPerks(): { show: boolean; threshold: string; thresholdTl: string } {
  const params = useStoreParameters();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  return {
    show: !(hydrated && user && !retailPerks(user) && !isAdminRole(user.role)),
    threshold: formatMoneyCompact(params.free_shipping_threshold),
    thresholdTl: `${TL.format(Number(params.free_shipping_threshold))} TL`,
  };
}
