import { NotFoundContent, notFoundMetadata } from "@/components/layout/NotFoundContent";

export const generateMetadata = notFoundMetadata;

/**
 * The 404 for a storefront page that calls `notFound()` — /marka/<unknown>,
 * /<unknown>, a category that does not exist. It renders inside this
 * group's layout, which already draws the header and footer, so it adds none:
 * the root 404 (app/not-found.tsx) brings its own and would stack a second set.
 */
export default function StorefrontNotFound() {
  return <NotFoundContent />;
}
