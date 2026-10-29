// The old store's (OpenCart) category addresses, read by next.config.ts (a
// 301 for each) and src/proxy.ts (where a dead product under one goes).
// No path aliases here: both are built apart from the pages.

/**
- The old store's (OpenCart) category address → where those products are now.
- Measured, not guessed: each old category page was read and its products
- looked up here; nearly all of each landed in the one category named. The
- herbal molasses shelf (/nargile-tutunu-markalari-ve-cesitleri, "Bitkisel
- Ürün tatları") goes to "Bitkisel Ürünler", where its 46 products are brought
- over (the backend's opencart_migration_tool, --allow-category).
 */
export const LEGACY_CATEGORIES: Record<string, string> = {
  "paslanmaz-celik-nargile-takimlari": "celik-takimlar",
  "legend-hookah-nargile-takimlari": "legend",
  "oduman-nargile-takimlari": "oduman",
  "meduse-experience-hookah-nargile-takimi": "meduse",
  "mr-wood-nargile-takimlari": "mr-wood",
  "sultan-nargile-takimlari-ve-malzemeleri": "sultan",
  "dokum-nargile-takimlari": "klasik-takimlar",
  "rus-nargile-takimlari-ve-modelleri": "rus-takimlar",
  "masaustu-ve-led-isikli-nargile-takimlari": "masaustu-takimlar",
  "nargile-siseleri": "siseler",
  "nargile-komuru": "komurler",
  "nargile-lule-cesitleri": "luleler",
  kozlukler: "kozlukler",
  "nargile-marpuclari": "marpuclar",
  "plastik-ve-ozel-sipsiler": "sipsiler",
  "nargile-malzemeleri-ve-aksesuarlari": "malzemeler",
  "yedek-parca": "malzemeler",
  "okey-tavla-ve-iskambil-kartlari": "oyun-eglence",
  "nargile-tutunu-markalari-ve-cesitleri": "bitkisel-urunler",
  kampanyalar: "kampanyalar",
  // Its WD Hookah sets are steel sets here (unpublished for now).
  "wd-hookah-nargile-takimlari": "celik-takimlar",
  // "Diğer" and its "Nargile Şerleri" held accessories, the latter none at all.
  diger: "malzemeler",
  "nargile-serleri": "malzemeler",
  // Shorter addresses of the same shelves, absent from its sitemap but still
  // reported as 404s by Search Console (2026-10-29): exact paths only — the
  // old product addresses that start the same (/oduman-n2-…, /mr.wood-…,
  // /legend-hookah-…) are products, answered by src/proxy.ts.
  "nargile-malzemeleri": "malzemeler",
  "rus-nargile-takimlari": "rus-takimlar",
  "celik-nargile-takimlari": "celik-takimlar",
  "lule-ve-lule-basliklari": "luleler",
  siseler: "siseler",
  oduman: "oduman",
  "mr.wood": "mr-wood",
  "legend-hookah": "legend",
  // Older names of the same shelves, seen in Search Console's 404 export
  // (2026-10-29) under the old store's product addresses.
  "ozel-sipsiler": "sipsiler",
  "oyun-aletleri": "oyun-eglence",
  marpuclar: "marpuclar",
  "wd-hookah": "celik-takimlar",
  "sultan-nargile-takimlari": "sultan",
  "masaustu-nargile-takimi": "masaustu-takimlar",
};

/**
 * The old store also listed its accessory shelves under "Diğer"
 * (/diger/kozlukler, /diger/nargile-komuru…): the same categories, one level
 * down — every one of them is answered at both addresses.
 */
export const LEGACY_PARENT = "diger";
