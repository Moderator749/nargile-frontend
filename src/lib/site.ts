export const SITE_NAME = "Nargile Malzemesi";

/** Public origin, used for canonical URLs, Open Graph and JSON-LD. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const DEFAULT_DESCRIPTION =
  "Nargile Malzemesi: endüstriyel nargile takımları, kömür, lüle ve aksesuarlar. Kafe, toptancı ve bayilere özel fiyatlar, ₺3.000 üzeri ücretsiz kargo, İstanbul içi kurye.";

/** Shared metadata for pages that must never appear in search results. */
export const PRIVATE_ROBOTS = { index: false, follow: false } as const;
