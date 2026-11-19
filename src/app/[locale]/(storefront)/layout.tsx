import type { ReactNode } from "react";

import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { MicrosoftClarity } from "@/components/analytics/MicrosoftClarity";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { StorefrontChrome } from "@/components/layout/StorefrontChrome";
import { CLARITY_PROJECT_ID } from "@/lib/analytics";

/**
 * Every shopper-facing page. Kept apart from the (admin) group so the two
 * share only the document itself (app/layout.tsx): no page here imports
 * anything under components/admin, and none of the panel's code — its views,
 * its rich-text editor — is ever sent to a shopper's browser. Google
 * Analytics is loaded here too, so the panel's own visits are not counted,
 * with the cookie banner whose choice it waits for (Consent Mode v2), and
 * Microsoft Clarity, which waits for the same choice.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StorefrontChrome>{children}</StorefrontChrome>
      <CookieConsentBanner />
      <GoogleAnalytics />
      {CLARITY_PROJECT_ID && <MicrosoftClarity projectId={CLARITY_PROJECT_ID} />}
    </>
  );
}
