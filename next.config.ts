import type { NextConfig } from "next";

const FALLBACK_API_URL = "http://127.0.0.1:8000/api/v1";

/**
 * Where browsers load uploaded media from: beside /api/v1 under the API's
 * public address (NEXT_PUBLIC_API_URL) — /media on the API itself, or
 * /api/backend/media through this site's proxy (the backend's PUBLIC_MEDIA_URL).
 */
function mediaUrl(): URL {
  let api: URL;
  try {
    api = new URL(process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_API_URL);
  } catch {
    api = new URL(FALLBACK_API_URL);
  }
  return new URL(`${api.pathname.replace(/\/api\/v1\/?$/, "")}/media/`, api.origin);
}

const MEDIA = mediaUrl();
/** The API is on this machine, so uploads are served from a loopback address. */
const MEDIA_IS_LOCAL = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(MEDIA.hostname);

/**
 * The API's own address (origin, no path), as src/lib/config.ts reads it. The
 * browser never sees it: it reaches the API through /api/backend (below).
 */
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
// Rewrites are fixed at build time: a deployment built without the variable
// would forward every API call to its own loopback. Fail the build instead.
if (process.env.VERCEL && !process.env.BACKEND_URL) {
  throw new Error("BACKEND_URL is not set (e.g. http://209.38.195.227:8000): the /api/backend proxy has nowhere to go.");
}

/**
- Old category slug → the live category its products are in now. A slug the
- current tree uses (celik-takimlar, komurler, sultan…) must never be listed
- here: the redirect would hide that category's page.
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
- The old store's (OpenCart) category address → where those products are now.
- Measured, not guessed: each old category page was read and its products
- looked up here; nearly all of each landed in the one category named. The
- herbal molasses shelf (/nargile-tutunu-markalari-ve-cesitleri, "Bitkisel
- Ürün tatları") goes to "Bitkisel Ürünler", where its 46 products are brought
- over (the backend's opencart_migration_tool, --allow-category).
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
  "nargile-tutunu-markalari-ve-cesitleri": "bitkisel-urunler",
  kampanyalar: "kampanyalar",
  // Its WD Hookah sets are steel sets here (unpublished for now).
  "wd-hookah-nargile-takimlari": "celik-takimlar",
  // "Diğer" and its "Nargile Şerleri" held accessories, the latter none at all.
  diger: "malzemeler",
  "nargile-serleri": "malzemeler",
};

/**
 * The old store also listed its accessory shelves under "Diğer"
 * (/diger/kozlukler, /diger/nargile-komuru…): the same categories, one level
 * down — every one of them is answered at both addresses.
 */
const LEGACY_PARENT = "diger";

/** The old store's pages that were not categories, and its brand pages. */

/**
 * Blog addresses that moved: the lüle guide (one article) became four
 * (src/lib/blog), and its address goes to the first, in every language.
 */
const RETIRED_ARTICLES: Record<string, string> = { "nargile-lule-rehberi": "nargile-lulesi-nedir" };

const LEGACY_PAGES: Record<string, string> = {
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
  "legend-hookah-nargile": "/catalog/legend",
  "sultan-nargile": "/catalog/sultan",
  "oduman%20nargile": "/catalog/oduman", // the old store's own spelling, with a space
};

const nextConfig: NextConfig = {
  /*
- Metadata (title, description, canonical, Open Graph) always in <head>.
- By default Next streams it into <body> for ordinary browsers and blocks
- only for a list of known bots; crawlers outside that list (AI crawlers,
- SEO tools, smaller search engines) would then find no <title> in the first
- HTML they read. Every page's metadata comes from cached catalog reads, so
- waiting for it costs little.
   */
  htmlLimitedBots: /.*/,

  /*
   * The browser's one way to the API (API_PROXY_PATH in src/lib/config.ts):
   * the page's own origin, so HTTPS whenever the page is, forwarded from here
   * to the API's plain-http address. The API's answer comes back as it is, so
   * the API must never redirect: a Location would name BACKEND_URL itself —
   * which is why it serves `/path/` and `/path` alike (the backend's
   * app/core/trailing_slash.py), Next having already dropped the slash.
   */
  async rewrites() {
    return [{ source: "/api/backend/:path*", destination: `${BACKEND_URL}/:path*` }];
  },

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
      ...Object.entries(LEGACY_CATEGORIES).flatMap(([from, to]) =>
        [`/${from}`, `/${LEGACY_PARENT}/${from}`].map((source) => ({
          source,
          destination: `/catalog/${to}`,
          statusCode: 301 as const,
        })),
      ),
      // The old store's sitemap files (sitemap-product-1.xml…), which search
      // engines still hold: ours lists every language.
      { source: "/sitemap-:file", destination: "/sitemap.xml", statusCode: 301 as const },
      ...Object.entries(LEGACY_PAGES).map(([from, to]) => ({
        source: `/${from}`,
        destination: to,
        statusCode: 301 as const,
      })),
      // The lüle guide, split into four articles (see RETIRED_ARTICLES).
      ...Object.entries(RETIRED_ARTICLES).flatMap(([from, to]) =>
        ["", "/en", "/ar"].map((prefix) => ({
          source: `${prefix}/blog/${from}`,
          destination: `${prefix}/blog/${to}`,
          statusCode: 301 as const,
        })),
      ),
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
    // AVIF where the browser takes it (a third smaller than WebP for these
    // photos), else WebP; the original JPEG only for a browser with neither.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Product photos imported from the supplier catalog.
      new URL("https://www.nargilemalzemesi.com/image/**"),
      // A product video's poster frame (gallery thumbnails).
      new URL("https://i.ytimg.com/vi/**"),
      // Photos the admin uploads, served by the API at /media (here at
      // /api/backend/media, through the proxy). Both loopback
      // spellings, since the stored URL carries whichever host the admin used.
      ...(MEDIA_IS_LOCAL
        ? [new URL(`${MEDIA.protocol}//localhost:${MEDIA.port}${MEDIA.pathname}**`), new URL(`${MEDIA.protocol}//127.0.0.1:${MEDIA.port}${MEDIA.pathname}**`)]
        : [new URL(`${MEDIA.href}**`)]),
    ],
    /*
- Next 16 refuses to optimise an image whose host resolves to a private or
- loopback address (an SSRF guard), which blocks every uploaded photo while
- the API runs on this machine — whatever the patterns above say.
     *
- So it is allowed exactly when the media host *is* local, which is a
- developer's setup; point NEXT_PUBLIC_API_URL at a real host and the guard
- goes back to doing its job.
     */
    dangerouslyAllowLocalIP: MEDIA_IS_LOCAL,
  },
};

export default nextConfig;