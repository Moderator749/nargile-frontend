/**
 * "Avantajlar": the eight cards the homepage shows by default, until they are
 * edited in "Ana Sayfa Düzenleme" (/admin/homepage).
 *
 * The five figures that describe how checkout behaves are the ones the engine
 * actually applies (`app/services/checkout_engine.py`): ₺3.000 for free
 * carriage with the 20 kg coal rule, the 30.000/50.000 ciro tiers at 5% and 8%,
 * and the havale discount at 5% and 7% — an edit to the copy does not change
 * what checkout charges, so the two have to be kept in step by hand.
 *
 * The photographs are the shop's own, in /public/images; the icon stands in
 * for a card whose `image` is empty.
 */

import type { HomeAdvantageCard } from "@/types";

/** A card as the homepage editor stores it; see `HomeAdvantageCard`. */
export type AdvantageItem = HomeAdvantageCard;

/** The default cards, shown until the homepage editor saves its own. */
export const ADVANTAGES: AdvantageItem[] = [
  {
    badge: "3.000 TL+",
    title: "Ücretsiz Kargo & Hızlı Sevk",
    description: "3.000 TL ve üzeri tüm siparişlerinizde kargo tamamen ücretsizdir.",
    note: "Kömür siparişlerinde minimum 20 kg kuralı geçerlidir.",
    image: "/images/avantaj-cat-komur.jpg",
    icon: "truck",
  },
  {
    badge: "İstanbul içi",
    title: "10:00 – 20:00 Hızlı Teslimat",
    description: "İstanbul içi aynı gün mağazadan kapınıza VIP kurye servisi.",
    note: "En yakın şubemizden anında sevk.",
    image: "/images/avantaj-oduman.jpg",
    icon: "bike",
  },
  {
    badge: "3 Taksit",
    title: "Peşin Fiyatına 3 Taksit",
    description: "Anlaşmalı tüm banka kartlarında vade farksız taksit avantajı.",
    note: "Ödeme adımında anında uygulanır.",
    image: "/images/avantaj-cat-nargile.jpg",
    icon: "credit-card",
  },
  {
    badge: "%5 – %8",
    title: "Otomatik Ciro İndirimi",
    description: "Sepet tutarınız büyüdükçe otomatik tanımlanan ekstra toptan iskonto.",
    note: "30.000 TL ve 50.000 TL üzeri baremler.",
    image: "/images/avantaj-cat-tutun.jpg",
    icon: "trending-up",
  },
  {
    badge: "%5 – %7",
    title: "Havale & EFT Nakit İndirimi",
    description: "Banka havalesi ile yapılan siparişlerde anında net indirim.",
    note: "Tüm sipariş baremlerinde geçerli.",
    image: "/images/avantaj-cat-aksesuar.jpg",
    icon: "landmark",
  },
  {
    badge: "%100 Orijinal",
    title: "Orijinal Ürün Güvencesi",
    description:
      "Tüm nargile takımları ve tütün markalarında doğrudan distribütör garantisi.",
    note: "Barkodlu ve faturalı sevkiyat.",
    image: "/images/avantaj-hero-1.jpg",
    icon: "badge-check",
  },
  {
    badge: "Teknik destek",
    title: "Birebir Uzman Desteği",
    description: "Nargile ustalarımızdan canlı ürün, lüle ve kömür kullanım danışmanlığı.",
    note: "Haftanın 7 günü WhatsApp hattı aktif.",
    image: "/images/avantaj-hero-3.jpg",
    icon: "headset",
  },
  {
    badge: "Toptan tedarik",
    title: "Nargile Kafeler & İşletmeler",
    description:
      "Kafeler ve tobacco shoplar için özel toptan fiyat listeleri ve düzenli sevkiyat.",
    note: "Kurumsal üyelik ile anında toptan fiyatlar.",
    image: "/images/avantaj-legend.jpg",
    icon: "store",
  },
];
