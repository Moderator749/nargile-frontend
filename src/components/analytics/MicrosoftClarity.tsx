"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";

import { readConsent, subscribeConsent } from "@/lib/consent";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Microsoft Clarity (heatmaps, session recordings). KVKK: it records the
 * visit and sets cookies, so it loads only for a visitor who chose "Tümünü
 * Kabul Et" (lib/consent), never before — nothing of it is in the server HTML.
 * `lazyOnload` waits for the browser to be idle after `load`, so it takes
 * nothing from LCP, INP or the first paint, and it draws nothing (no CLS).
 * Taking consent back tells Clarity at once (consentv2 denied: no cookies,
 * no further recording); the next page load leaves it out entirely.
 */
export function MicrosoftClarity({ projectId }: { projectId: string }) {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => null);

  useEffect(() => {
    if (consent === "denied") window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
  }, [consent]);

  if (consent !== "granted") return null;
  return (
    <Script id="ms-clarity" strategy="lazyOnload">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(projectId)});` +
        `window.clarity("consentv2",{ad_Storage:"granted",analytics_Storage:"granted"});`}
    </Script>
  );
}
