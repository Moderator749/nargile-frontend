import Script from "next/script";

import { GA_MEASUREMENT_ID } from "@/lib/analytics";

/**
 * Google Analytics 4 (gtag.js), loaded after hydration (`afterInteractive`):
 * it never holds up the first paint or the page becoming interactive, and
 * adds nothing to the layout (no CLS). Page views on client-side navigation
 * come from GA4's enhanced measurement ("page changes based on browser
 * history events"), so no route listener is needed here.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <Script
        id="ga-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
