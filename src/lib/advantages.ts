/**
 * "Avantajlar": the eight things the shop wants a buyer to know.
 *
 * Written here rather than read from /admin/advantages, because the cards carry
 * an image each and that CMS row has no image to give — see the note below. The
 * five figures that describe how checkout behaves are the ones the engine
 * actually applies (`app/services/checkout_engine.py`): ₺3.000 for free
 * carriage with the 20 kg coal rule, the 30.000/50.000 ciro tiers at 5% and 8%,
 * and the havale discount at 5% and 7%.
 *
 * The photographs are the shop's own, carried over from sultannargile.com's
 * asset folder into /public/images. Four of them say what their card says —
 * boxed coal ready to ship, the ornate set behind the authenticity promise, the
 * parts flat-lay behind technical support, a premium set for the trade — and
 * four stand in, because neither project has a photograph of a courier, a bank
 * transfer, a card terminal or a warehouse. Swapping those four is one line
 * each once the pictures exist; the icon stays as the fallback for an item
 * whose `image` is null.
 */

import {
  BadgeCheck,
  Bike,
  CreditCard,
  Headset,
  Landmark,
  Store,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";

export interface AdvantageItem {
  /** The small red line above the title; the figure, where there is one. */
  badge: string;
  title: string;
  description: string;
  /** The condition under it, in smaller, quieter type. */
  note?: string;
  /** A photograph for the card's left box; the icon stands in while it is null. */
  image?: string | null;
  Icon: LucideIcon;
}

export const ADVANTAGES: AdvantageItem[] = [
  {
    badge: "₺3.000+",
    title: "Ücretsiz Kargo & Hızlı Sevk",
    description: "3.000 TL ve üzeri tüm siparişlerinizde kargo tamamen ücretsizdir.",
    note: "Kömür siparişlerinde minimum 20 kg kuralı geçerlidir.",
    image: "/images/avantaj-cat-komur.jpg",
    Icon: Truck,
  },
  {
    badge: "İstanbul içi",
    title: "10:00 – 20:00 Hızlı Teslimat",
    description: "İstanbul içi aynı gün mağazadan kapınıza VIP kurye servisi.",
    note: "En yakın şubemizden anında sevk.",
    image: "/images/avantaj-oduman.jpg",
    Icon: Bike,
  },
  {
    badge: "3 Taksit",
    title: "Peşin Fiyatına 3 Taksit",
    description: "Anlaşmalı tüm banka kartlarında vade farksız taksit avantajı.",
    note: "Ödeme adımında anında uygulanır.",
    image: "/images/avantaj-cat-nargile.jpg",
    Icon: CreditCard,
  },
  {
    badge: "%5 – %8",
    title: "Otomatik Ciro İndirimi",
    description: "Sepet tutarınız büyüdükçe otomatik tanımlanan ekstra toptan iskonto.",
    note: "30.000 TL ve 50.000 TL üzeri baremler.",
    image: "/images/avantaj-cat-tutun.jpg",
    Icon: TrendingUp,
  },
  {
    badge: "%5 – %7",
    title: "Havale & EFT Nakit İndirimi",
    description: "Banka havalesi ile yapılan siparişlerde anında net indirim.",
    note: "Tüm sipariş baremlerinde geçerli.",
    image: "/images/avantaj-cat-aksesuar.jpg",
    Icon: Landmark,
  },
  {
    badge: "%100 Orijinal",
    title: "Orijinal Ürün Güvencesi",
    description:
      "Tüm nargile takımları ve tütün markalarında doğrudan distribütör garantisi.",
    note: "Barkodlu ve faturalı sevkiyat.",
    image: "/images/avantaj-hero-1.jpg",
    Icon: BadgeCheck,
  },
  {
    badge: "Teknik destek",
    title: "Birebir Uzman Desteği",
    description: "Nargile ustalarımızdan canlı ürün, lüle ve kömür kullanım danışmanlığı.",
    note: "Haftanın 7 günü WhatsApp hattı aktif.",
    image: "/images/avantaj-hero-3.jpg",
    Icon: Headset,
  },
  {
    badge: "Toptan tedarik",
    title: "Nargile Kafeler & İşletmeler",
    description:
      "Kafeler ve tobacco shoplar için özel toptan fiyat listeleri ve düzenli sevkiyat.",
    note: "Kurumsal üyelik ile anında toptan fiyatlar.",
    image: "/images/avantaj-legend.jpg",
    Icon: Store,
  },
];
