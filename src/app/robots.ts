import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// Private pages are not disallowed here on purpose: crawlers must be able to fetch
// them to see their `noindex` meta tag (a disallowed URL can still get indexed).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
