import type { LegalKey } from "@/types";

/**
 * The shop's legal texts that have a page of their own, under /sozlesmeler:
 * the texts edited in "Yasal Metinler" (/admin/settings/legal), read live, so
 * the footer can link to them. The distance sales agreement is a Bilgi page
 * of its own (/bilgi/mesafeli-satis-sozlesmesi), the shop's signed text.
 */
export const LEGAL_PAGES: { slug: string; key: LegalKey }[] = [
  { slug: "kvkk-aydinlatma-metni", key: "PRIVACY" },
  { slug: "cerez-politikasi", key: "COOKIES" },
  { slug: "kullanim-sartlari", key: "TERMS" },
];

export const legalHref = (key: LegalKey) => `/sozlesmeler/${LEGAL_PAGES.find((p) => p.key === key)!.slug}`;

/** The footer's "İptal & İade Koşulları": the right of withdrawal in the distance sales agreement. */
export const RETURNS_HREF = "/bilgi/mesafeli-satis-sozlesmesi#madde-6";
export const DISTANCE_SALES_HREF = "/bilgi/mesafeli-satis-sozlesmesi";
