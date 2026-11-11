import Script from "next/script";

import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { gtagInitScript } from "@/lib/consent";

/**
 * Google Analytics 4 (gtag.js), loaded after hydration (`afterInteractive`):
 * it never holds up the first paint or the page becoming interactive, and
 * adds nothing to the layout (no CLS). Page views on client-side navigation
 * come from GA4's enhanced measurement ("page changes based on browser
 * history events"), so no route listener is needed here.
 *
 * Consent Mode v2: the init script, placed first, sets every signal to
 * denied before `config` and grants them straight away only for a visitor
 * who chose "Tümünü Kabul Et" earlier (lib/consent). gtag.js works through
 * dataLayer in order, so the defaults precede `config` whichever loads first.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {gtagInitScript(GA_MEASUREMENT_ID)}
      </Script>
      <Script
        id="ga-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
