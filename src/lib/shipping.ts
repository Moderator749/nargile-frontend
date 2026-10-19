import { Building2, Package, Ship, Truck, Van, type LucideIcon } from "lucide-react";

import type { ShippingMethod } from "@/types";

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

export const shippingOption = (method: ShippingMethod): ShippingOption => OPTIONS[method];
