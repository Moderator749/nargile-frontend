import type { ReactNode } from "react";

import { StorefrontChrome } from "@/components/layout/StorefrontChrome";

/**
 * Every shopper-facing page. Kept apart from the (admin) group so the two
 * share only the document itself (app/layout.tsx): no page here imports
 * anything under components/admin, and none of the panel's code — its views,
 * its rich-text editor — is ever sent to a shopper's browser.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
