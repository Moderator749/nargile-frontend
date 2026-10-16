import { Building2, Package, Ship, Truck, Van, type LucideIcon } from "lucide-react";

import type { AccountType, ShippingMethod } from "@/types";

export interface ShippingOption {
  value: ShippingMethod;
  title: string;
  /** The line under the title; empty where the title says it all. */
  hint: string;
  Icon: LucideIcon;
}

const OPTIONS: Record<ShippingMethod, ShippingOption> = {
  YURTICI_DOOR: {
    value: "YURTICI_DOOR",
    title: "Yurtiçi Kargo (Adrese Teslim)",
    // Replaced below for an account that cannot reach the free-shipping threshold.
    // The threshold itself is a panel setting, so it is not written into the hint.
    hint: "Ücretsiz kargo limiti üzerinde ücretsiz",
    Icon: Truck,
  },
  YURTICI_BRANCH: {
    value: "YURTICI_BRANCH",
    title: "Yurtiçi Kargo (Şube Teslimatı)",
    hint: "Adınıza gönderilir",
    Icon: Package,
  },
  NAKLIYE_AMBARI: {
    value: "NAKLIYE_AMBARI",
    title: "Nakliye Ambarı ile Teslimat",
    hint: "Ambar ücreti teslim alırken ödenir",
    Icon: Building2,
  },
  ISTANBUL_FREE: {
    value: "ISTANBUL_FREE",
    title: "İstanbul İçi Ücretsiz Teslimat",
    hint: "Kendi aracımızla, teslimat öncesi arayarak",
    Icon: Van,
  },
  INTERNATIONAL_FREIGHT: {
    value: "INTERNATIONAL_FREIGHT",
    title: "Uluslararası Navlun / Gümrük",
    hint: "Kargo bedeli sipariş sonrasında belirlenecektir",
    Icon: Ship,
  },
};

/**
 * What each kind of account may be shipped by, in the order it is offered.
 * Mirrors `METHODS_BY_ACCOUNT_TYPE` in `app/services/checkout_engine.py`, which
 * refuses anything else.
 *
 * A bireysel parcel goes to a door or to a branch. A firm's goes to its door by
 * Yurtiçi, to a nakliye ambarı, or — in İstanbul only, and then free — on the
 * shop's own van. An export order goes one way, and its cost is quoted
 * afterwards.
 */
const BUSINESS: ShippingMethod[] = ["YURTICI_DOOR", "NAKLIYE_AMBARI", "ISTANBUL_FREE"];
const BY_ACCOUNT_TYPE: Record<AccountType, ShippingMethod[]> = {
  INDIVIDUAL: ["YURTICI_DOOR", "YURTICI_BRANCH"],
  CAFE: BUSINESS,
  TOBACCO_SHOP: BUSINESS,
  INTERNATIONAL: ["INTERNATIONAL_FREIGHT"],
  SOLE_PROPRIETOR: BUSINESS,
  COMPANY: BUSINESS,
};

/**
 * The options to offer this account.
 *
 * The İstanbul van is offered only where it goes: on the *registered* address,
 * not on whatever city is typed into the form, which is the same test the
 * server applies.
 *
 * Free shipping is a retail promotion (see `lib/perks`), so for a firm Yurtiçi
 * Kargo is the same deal as a nakliye ambarı — carriage is paid on delivery,
 * whatever the cart is worth. Promising free shipping over a threshold there would be
 * advertising something the server will not give.
 */
export function shippingOptions({
  accountType,
  registeredInIstanbul,
  perks,
}: {
  accountType: AccountType;
  registeredInIstanbul: boolean;
  perks: boolean;
}): ShippingOption[] {
  return BY_ACCOUNT_TYPE[accountType]
    .filter((method) => method !== "ISTANBUL_FREE" || registeredInIstanbul)
    .map((method) =>
      method === "YURTICI_DOOR" && !perks
        ? { ...OPTIONS.YURTICI_DOOR, hint: "Gönderim ücreti teslimatta ödenir" }
        : OPTIONS[method],
    );
}

export const shippingOption = (method: ShippingMethod): ShippingOption => OPTIONS[method];
