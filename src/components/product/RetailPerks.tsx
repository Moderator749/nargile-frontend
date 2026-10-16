"use client";

import { BadgePercent, Clock, Crown, Landmark, ShieldCheck, Truck, type LucideIcon } from "lucide-react";

import { formatMoneyCompact } from "@/lib/format";
import { retailPerks } from "@/lib/perks";
import { formatRate, rateRange } from "@/lib/storeParameters";
import { useAuthStore } from "@/store/useAuthStore";
import type { StoreParameters, User } from "@/types";

interface Perk {
  Icon: LucideIcon;
  title: string;
  note: string;
}

/**
 * The terms a retail buyer gets. Three of them are what checkout computes, read
 * from the live parameters ("Parametreler" in the panel): the free shipping
 * threshold, the havale ladder and Sultan Puan — each left out while the panel
 * has it switched off or empty. The other two are the shop's own promises
 * rather than anything the cart arithmetic knows about.
 */
function perks(params: StoreParameters): Perk[] {
  const threshold = formatMoneyCompact(params.free_shipping_threshold);
  const havale = rateRange(params.bank_transfer_tiers);
  return [
    {
      Icon: Truck,
      title: `${threshold}+ Ücretsiz Kargo & Hızlı Sevk`,
      note: `${threshold} ve üzeri siparişlerde kargo ücretsiz.`,
    },
    ...(havale
      ? [
          {
            Icon: Landmark,
            title: `Havale / EFT ile ${havale} İndirim`,
            note: "Ödeme adımında anında otomatik sepet indirimi.",
          },
        ]
      : []),
    ...(params.loyalty.enabled && Number(params.loyalty.base_rate) > 0
      ? [
          {
            Icon: Crown,
            title: "Sultan Puan Kazanın",
            note: `${formatMoneyCompact(params.loyalty.band_min)} – ${formatMoneyCompact(params.loyalty.band_max)} arası siparişlerde ${formatRate(params.loyalty.base_rate)} Sultan Puan; bir sonraki alışverişinizde indirim olarak kullanın.`,
          },
        ]
      : []),
    ...PROMISES,
  ];
}

const PROMISES: Perk[] = [
  {
    Icon: Clock,
    title: "İstanbul İçi Kurye Aynı Gün Teslimat",
    note: "Saat 10:00 – 20:00 arası hızlı teslimat seçeneği.",
  },
  {
    Icon: ShieldCheck,
    title: "%100 Orijinal Ürün & Güvenli Ödeme",
    note: "256-bit SSL güvencesiyle distribütör garantili.",
  },
];

/**
 * The retail buyer's terms, in the space beside the title and the price.
 *
 * Unboxed on purpose: no card, no rule, no tint. Four points sitting on the
 * page beside the price, each far enough from the next to be read as its own
 * reason to buy rather than as a row in a table of terms. The spacing is also
 * what makes the column come out roughly as tall as the brand, title, code,
 * price and stock badge it stands beside.
 *
 * Shown to a bireysel account and to a visitor who has not signed in — someone
 * who would buy at retail if they did. Never to a kafe, a bayi or a toptan
 * account: those buy from their own price list, and `lib/perks` (which mirrors
 * the server's rule) says their discounts are zero by rule. Offering them here
 * would be offering something checkout will not honour.
 */
/**
 * Whether this visitor sees the dock, which the column holding it has to know
 * too: an empty grid cell would leave the title and price squeezed into half
 * the width for a B2B account.
 *
 * `retailPerks` answers false for a guest, because for cart arithmetic a guest
 * has no account. Here a guest counts: they would buy at retail if they signed
 * in, and this is the block that argues they should.
 */
export const showsRetailPerks = (user: Pick<User, "account_type" | "segment_code"> | null) =>
  !user || retailPerks(user);

export function RetailPerks({ params }: { params: StoreParameters }) {
  const user = useAuthStore((s) => s.user);
  if (!showsRetailPerks(user)) return null;

  return (
    <aside
      aria-label="Bireysel alışveriş avantajları"
      className="flex w-full flex-col"
    >
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 sm:mb-4 dark:text-red-400">
        <BadgePercent className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
        Size Özel Alışveriş Avantajları
      </p>

      <ul className="space-y-5 sm:space-y-6">
        {perks(params).map(({ Icon, title, note }) => (
          <li key={title} className="flex items-start gap-2.5">
            <Icon
              className="mt-[3px] h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold leading-snug text-neutral-800 dark:text-neutral-200">
                {title}
              </span>
              <span className="mt-0.5 block text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
                {note}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
