"use client";

import { ErrorContent } from "@/components/layout/ErrorContent";

/**
 * A storefront page that failed to render — most often the catalog API down
 * on a page not in the cache (BackendUnavailableError, lib/server/catalog.ts).
 * It renders inside this group's layout, so the header and footer stay and
 * the visitor can carry on; the response is a 500, which search engines treat
 * as temporary, unlike a 404.
 */
export default function StorefrontError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorContent {...props} />;
}
