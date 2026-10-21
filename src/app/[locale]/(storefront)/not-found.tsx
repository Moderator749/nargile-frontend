import type { Metadata } from "next";

import { NOT_FOUND_METADATA, NotFoundContent } from "@/components/layout/NotFoundContent";

export const metadata: Metadata = NOT_FOUND_METADATA;

/**
 * The 404 for a storefront page that calls `notFound()` — /marka/<unknown>,
 * /product/<unknown>, a category that does not exist. It renders inside this
 * group's layout, which already draws the header and footer, so it adds none:
 * the root 404 (app/not-found.tsx) brings its own and would stack a second set.
 */
export default function StorefrontNotFound() {
  return <NotFoundContent />;
}
