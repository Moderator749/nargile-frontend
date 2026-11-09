import type { BulkRule } from "@/lib/categoryBulk";

export const VOLUME_DISCOUNT_HINT =
  "sepet indirim limitine gelindiğinde %5 ve %8 ciro indirimi otomatik olarak uygulansın";

/**
 * "Genel Kurallar"'s switches, in the sheet's order: the product sheet and a
 * category's "Tüm Ürünlere Toplu Ayar Uygula" both read them from here, so
 * the two say the same thing. ("Adet Şartı" follows Ücretsiz Kargo.)
 */
export const GENERAL_RULES: readonly { field: BulkRule; id: string; label: string; hint?: string }[] = [
  { field: "is_free_shipping", id: "rule-shipping", label: "Ücretsiz Kargo", hint: "Bu ürün için gönderim ücreti firmaya ait." },
  { field: "has_havale_discount", id: "rule-havale", label: "Havale / EFT İndirimi" },
  {
    field: "has_dealer_havale_discount",
    id: "rule-dealer-havale",
    label: "Bayide Havale / EFT İndirimi",
    hint: "Havale / EFT indirimi bayi fiyat grubundaki müşteriler için de geçerli.",
  },
  {
    field: "has_toptan_havale_discount",
    id: "rule-toptan-havale",
    label: "Toptanda Havale / EFT İndirimi",
    hint: "Havale / EFT indirimi toptan fiyat grubundaki müşteriler için de geçerli.",
  },
  {
    field: "has_cafe_havale_discount",
    id: "rule-cafe-havale",
    label: "Kafede Havale / EFT İndirimi",
    hint: "Havale / EFT indirimi kafe fiyat grubundaki müşteriler için de geçerli.",
  },
  { field: "has_volume_discount", id: "rule-volume", label: "Sepet İndirimi", hint: VOLUME_DISCOUNT_HINT },
  { field: "gives_points", id: "rule-earn", label: "Sultan Puan Kazandırır" },
  { field: "can_use_points", id: "rule-spend", label: "Sultan Puan ile Alınabilir" },
  {
    field: "is_cart_rule_applied",
    id: "rule-cart",
    label: "Sepet Kuralı",
    hint: "Açıkken ürün %50 kuralına girer: sepetin %50'sinden fazlasıysa ücretsiz kargo belirlenen parametre kuralıyla başlar.",
  },
];
