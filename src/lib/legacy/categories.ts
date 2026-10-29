// The old store's (OpenCart) category and page addresses and this shop's
// retired category slugs, each answered by src/proxy.ts with one 301.
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
  "yedek-parca": "yedek-parca",
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
  "ozel-sipsiler": "ozel-sipsiler",
  "oyun-aletleri": "oyun-eglence",
  marpuclar: "marpuclar",
  // The brand's own page now (/wd-hookah): its old address is that page.
  "wd-hookah": "wd-hookah",
  "sultan-nargile-takimlari": "sultan",
  "masaustu-nargile-takimi": "masaustu-takimlar",
};

/**
 * The old store also listed its accessory shelves under "Diğer"
 * (/diger/kozlukler, /diger/nargile-komuru…): the same categories, one level
 * down — every one of them is answered at both addresses.
 */
export const LEGACY_PARENT = "diger";

/**
- Old category slug → the live category its products are in now. A slug the
- current tree uses (celik-takimlar, komurler, sultan…) must never be listed
- here: the redirect would hide that category's page. Each is reserved in the
- backend (RESERVED_ROOT_PATHS): no product or category may take it.
 */
export const RETIRED_CATEGORIES: Record<string, string> = {
  "nargile-komurleri": "komurler",
  "hindistan-cevizi-komurleri": "komurler",
  "bitkisel-karisimlar": "bitkisel-urunler",
  "marpuc-ve-hortumlar": "marpuclar",
  "kozlukler-isi-yonetimi": "kozlukler",
  "yedek-siseler": "siseler",
  "yedek-sise-ve-govde": "siseler",
  "nargile-siseleri": "siseler",
  "masaustu-nargile-takimlari": "masaustu-takimlar",
  "mini-masaustu-takimlar": "masaustu-takimlar",
  "rus-takimlari": "rus-takimlar",
  "panada-hookah": "panada",
  "sultan-nargile": "sultan",
  "legend-hookah": "legend",
  "oduman-nargile": "oduman",
  "mr-wood-nargile": "mr-wood",
  "steamulation-nargile-takimlari": "steamulation",
  "quasar-arguile": "quasar",
  "meduse-nargile-takimlari": "meduse",
};

/** The old store's pages that were not categories, and its brand pages. */
export const LEGACY_PAGES: Record<string, string> = {
  "teslimat-ve-kargolama-bilgileri": "/bilgi/kargo-ve-teslimat",
  "sartlar-ve-kosullar": "/bilgi/uyelik-ve-kullanim-sartlari",
  "sikca-sorulan-sorular": "/sss",
  // No page of their own here: the shop's story is the homepage's closing
  // passage, the privacy terms are among the Bilgi documents.
  hakkimizda: "/",
  "gizlilik-sozlesmesi": "/bilgi",
  // "İthal Nargile" was empty when the old store was read.
  "ithal-nargile": "/catalog",
  // Brand pages (manufacturers) → the brand's category.
  "legend-hookah-nargile": "/legend",
  "sultan-nargile": "/sultan",
  "oduman%20nargile": "/oduman", // the old store's own spelling, with a space
};
