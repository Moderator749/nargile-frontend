import { Building2, Package, Ship, Truck, Van, type LucideIcon } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import type { ShippingMethod } from "@/types";

export interface ShippingOption {
  value: ShippingMethod;
  title: string;
  /** The line under the title; empty where the title says it all. */
  hint: string;
  Icon: LucideIcon;
}

/** The words for each method; Turkish is what the admin panel reads too. */
const COPY: Record<Locale, Record<ShippingMethod, { title: string; hint: string }>> = {
  tr: {
    YURTICI_DOOR: {
      title: "Yurtiçi Kargo (Adrese Teslim)",
      // Replaced below for an account that cannot reach the free-shipping threshold.
      // The threshold itself is a panel setting, so it is not written into the hint.
      hint: "Ücretsiz kargo limiti üzerinde ücretsiz",
    },
    YURTICI_BRANCH: { title: "Yurtiçi Kargo (Şube Teslimatı)", hint: "Adınıza gönderilir" },
    NAKLIYE_AMBARI: { title: "Nakliye Ambarı ile Teslimat", hint: "Ambar ücreti teslim alırken ödenir" },
    ISTANBUL_FREE: { title: "İstanbul İçi Ücretsiz Teslimat", hint: "Kendi aracımızla, teslimat öncesi arayarak" },
    INTERNATIONAL_FREIGHT: {
      title: "Uluslararası Navlun / Gümrük",
      hint: "Kargo bedeli sipariş sonrasında belirlenecektir",
    },
  },
  en: {
    YURTICI_DOOR: { title: "Yurtiçi Kargo (Door Delivery)", hint: "Free above the free-shipping threshold" },
    YURTICI_BRANCH: { title: "Yurtiçi Kargo (Branch Pickup)", hint: "Sent in your name" },
    NAKLIYE_AMBARI: { title: "Delivery via Freight Depot", hint: "The depot fee is paid on collection" },
    ISTANBUL_FREE: { title: "Free Delivery within Istanbul", hint: "In our own vehicle; we call before we arrive" },
    INTERNATIONAL_FREIGHT: {
      title: "International Freight / Customs",
      hint: "The shipping cost is set after the order",
    },
  },
  ar: {
    YURTICI_DOOR: { title: "Yurtiçi Kargo (التوصيل إلى العنوان)", hint: "مجاني فوق حد الشحن المجاني" },
    YURTICI_BRANCH: { title: "Yurtiçi Kargo (الاستلام من الفرع)", hint: "يُرسل باسمك" },
    NAKLIYE_AMBARI: { title: "التوصيل عبر مستودع الشحن", hint: "تُدفع رسوم المستودع عند الاستلام" },
    ISTANBUL_FREE: { title: "توصيل مجاني داخل إسطنبول", hint: "بسيارتنا الخاصة، مع اتصال قبل الوصول" },
    INTERNATIONAL_FREIGHT: { title: "الشحن الدولي / الجمارك", hint: "تُحدَّد تكلفة الشحن بعد الطلب" },
  },
};

const ICONS: Record<ShippingMethod, LucideIcon> = {
  YURTICI_DOOR: Truck,
  YURTICI_BRANCH: Package,
  NAKLIYE_AMBARI: Building2,
  ISTANBUL_FREE: Van,
  INTERNATIONAL_FREIGHT: Ship,
};

/** A method's name, line and icon; in Turkish unless a page's language is given. */
export const shippingOption = (method: ShippingMethod, locale: Locale = "tr"): ShippingOption => ({
  value: method,
  ...COPY[locale][method],
  Icon: ICONS[method],
});
