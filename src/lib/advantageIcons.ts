import {
  BadgeCheck,
  Bike,
  Clock,
  CreditCard,
  Gift,
  Landmark,
  Package,
  Percent,
  PiggyBank,
  Shield,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";

/** Icons an advantage tile may use; keys match the backend's ADVANTAGE_ICONS. */
export const ADVANTAGE_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  truck: { icon: Truck, label: "Kargo" },
  bike: { icon: Bike, label: "Kurye" },
  "credit-card": { icon: CreditCard, label: "Kart / taksit" },
  landmark: { icon: Landmark, label: "Banka / havale" },
  "piggy-bank": { icon: PiggyBank, label: "Puan / birikim" },
  "trending-up": { icon: TrendingUp, label: "Ciro / artış" },
  "badge-check": { icon: BadgeCheck, label: "Onay / garanti" },
  clock: { icon: Clock, label: "Saat" },
  gift: { icon: Gift, label: "Hediye" },
  percent: { icon: Percent, label: "İndirim" },
  shield: { icon: Shield, label: "Güvence" },
  package: { icon: Package, label: "Paket" },
};

export const advantageIcon = (key: string): LucideIcon => ADVANTAGE_ICONS[key]?.icon ?? BadgeCheck;
