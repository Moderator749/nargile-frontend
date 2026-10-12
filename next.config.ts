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

const nextConfig: NextConfig = {
  // The dashboard ("Genel Bakış") lives at /admin; keep /admin/overview working too.
  async redirects() {
    return [
      { source: "/admin/overview", destination: "/admin", permanent: false },
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
