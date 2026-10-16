import type { NextConfig } from "next";

const FALLBACK_API_URL = "http://127.0.0.1:8000/api/v1";

/** Where the API serves uploaded media from, derived from the API base URL. */
function mediaUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_API_URL);
  } catch {
    return new URL(FALLBACK_API_URL);
  }
}

const MEDIA = mediaUrl();
/** The API is on this machine, so uploads are served from a loopback address. */
const MEDIA_IS_LOCAL = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(MEDIA.hostname);

/**
 * Old category slug → the live category its products are in now. A slug the
 * current tree uses (celik-takimlar, komurler, sultan…) must never be listed
 * here: the redirect would hide that category's page.
 */
const RETIRED_CATEGORIES: Record<string, string> = {
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

/**
 * The old store's (OpenCart) category address → where those products are now.
 * Measured, not guessed: each old category page was read and its products
 * looked up here; nearly all of each landed in the one category named. The
 * tobacco category is left out on purpose — it is not sold online, and its
 * address must not lead to anything that looks like a replacement.
 */
const LEGACY_CATEGORIES: Record<string, string> = {
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
  kampanyalar: "kampanyalar",
};

/** The old store's information pages → ours. */
const LEGACY_PAGES: Record<string, string> = {
  "teslimat-ve-kargolama-bilgileri": "/bilgi/kargo-ve-teslimat",
  "sartlar-ve-kosullar": "/bilgi/uyelik-ve-kullanim-sartlari",
  "sikca-sorulan-sorular": "/sss",
};

const nextConfig: NextConfig = {
  // The dashboard ("Genel Bakış") lives at /admin; keep /admin/overview working too.
  async redirects() {
    return [
      { source: "/admin/overview", destination: "/admin", permanent: false },
      // "Teslimat Ayarları" moved into Parametreler with every other threshold.
      // Exact path only: /admin/settings/legal (Sözleşmeler) stays where it is.
      { source: "/admin/settings", destination: "/admin/parameters", permanent: true },
      // Category pages retired by the taxonomy migrations (see RETIRED_CATEGORIES),
      // forwarded for good to where their products went, so an old link or a
      // search result never lands on a 404.
      // 301 rather than Next's default 308 for `permanent`: the code every
      // crawler and old client has treated as "moved for good" the longest.
      ...Object.entries(RETIRED_CATEGORIES).map(([from, to]) => ({
        source: `/catalog/${from}`,
        destination: `/catalog/${to}`,
        statusCode: 301 as const,
      })),
      // The old store's addresses, so its links and its search results keep
      // landing on the same shelf when the domain moves here. (Its product
      // addresses are answered by src/proxy.ts, which asks the API.)
      ...Object.entries(LEGACY_CATEGORIES).map(([from, to]) => ({
        source: `/${from}`,
        destination: `/catalog/${to}`,
        statusCode: 301 as const,
      })),
      ...Object.entries(LEGACY_PAGES).map(([from, to]) => ({
        source: `/${from}`,
        destination: to,
        statusCode: 301 as const,
      })),
      // Category management moved into Ana Sayfa Düzenleme.
      { source: "/admin/categories", destination: "/admin/homepage?tab=katalog-kategorileri", permanent: true },
      // `/catalog?category=<slug>` is how other shops (and old links) name a
      // category; ours live at /catalog/<slug>.
      {
        source: "/catalog",
        has: [{ type: "query", key: "category", value: "(?<slug>[a-z0-9-]+)" }],
        destination: "/catalog/:slug",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Product photos imported from the supplier catalog.
      new URL("https://www.nargilemalzemesi.com/image/**"),
      // Photos the admin uploads, served by the API at /media. Both loopback
      // spellings, since the stored URL carries whichever host the admin used.
      ...(MEDIA_IS_LOCAL
        ? [new URL(`${MEDIA.protocol}//localhost:${MEDIA.port}/media/**`), new URL(`${MEDIA.protocol}//127.0.0.1:${MEDIA.port}/media/**`)]
        : [new URL(`${MEDIA.origin}/media/**`)]),
    ],
    /*
     * Next 16 refuses to optimise an image whose host resolves to a private or
     * loopback address (an SSRF guard), which blocks every uploaded photo while
     * the API runs on this machine — whatever the patterns above say.
     *
     * So it is allowed exactly when the media host *is* local, which is a
     * developer's setup; point NEXT_PUBLIC_API_URL at a real host and the guard
     * goes back to doing its job.
     */
    dangerouslyAllowLocalIP: MEDIA_IS_LOCAL,
  },
};

export default nextConfig;
