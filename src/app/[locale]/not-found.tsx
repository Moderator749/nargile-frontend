import { NotFoundContent, notFoundMetadata } from "@/components/layout/NotFoundContent";
import { StorefrontChrome } from "@/components/layout/StorefrontChrome";

export const generateMetadata = notFoundMetadata;

/**
 * The 404 for an address no route matches (a mistyped link, an old URL). It
 * renders under the root layout alone, which has no menus (see
 * app/(storefront)/layout.tsx), so it brings the shop's chrome itself.
 *
 * A storefront page that calls `notFound()` (an unknown brand, product or
 * category slug) gets app/(storefront)/not-found.tsx instead: that one renders
 * inside the group's layout, whose chrome is already on the page.
 */
export default function NotFound() {
  return (
    <StorefrontChrome>
      <NotFoundContent />
    </StorefrontChrome>
  );
}
