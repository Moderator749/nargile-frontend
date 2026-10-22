import {
  BadgeCheck,
  Bike,
  CreditCard,
  Flame,
  Gamepad2,
  Headset,
  Landmark,
  Layers,
  Package,
  Shield,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Truck,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { HomeIconKey } from "@/types";

/**
 * The icons a showcase tile or an advantage card can stand behind while it has
 * no photograph. Stored by key in the homepage document, so the set the panel
 * offers is exactly the set the backend accepts (`IconKey` in
 * app/schemas/homepage.py).
 */
export const HOME_ICONS: Record<HomeIconKey, { Icon: LucideIcon; label: string }> = {
  wind: { Icon: Wind, label: "Nargile" },
  wrench: { Icon: Wrench, label: "Anahtar" },
  flame: { Icon: Flame, label: "Alev" },
  layers: { Icon: Layers, label: "Katmanlar" },
  sparkles: { Icon: Sparkles, label: "Parıltı" },
  shield: { Icon: Shield, label: "Kalkan" },
  package: { Icon: Package, label: "Paket" },
  gamepad: { Icon: Gamepad2, label: "Oyun" },
  truck: { Icon: Truck, label: "Kargo" },
  bike: { Icon: Bike, label: "Kurye" },
  "credit-card": { Icon: CreditCard, label: "Kart" },
  landmark: { Icon: Landmark, label: "Banka" },
  "trending-up": { Icon: TrendingUp, label: "Yükseliş" },
  "badge-check": { Icon: BadgeCheck, label: "Onay" },
  headset: { Icon: Headset, label: "Destek" },
  store: { Icon: Store, label: "Mağaza" },
  "shopping-cart": { Icon: ShoppingCart, label: "Sepet" },
  "trending-down": { Icon: TrendingDown, label: "İndirim" },
};

export const homeIcon = (key: HomeIconKey | undefined): LucideIcon => HOME_ICONS[key ?? "package"]?.Icon ?? Package;
