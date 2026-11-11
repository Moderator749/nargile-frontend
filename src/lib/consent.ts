/**
 * The visitor's cookie choice (KVKK): analytics and advertising cookies only
 * after "Tümünü Kabul Et", none before. Kept in localStorage under
 * CONSENT_KEY as {"choice": "granted" | "denied", "at": ISO date}, read by
 * the Google tag's init script (components/analytics/GoogleAnalytics) before
 * its first `config`, and by the banner (components/common/CookieConsentBanner).
 */

export const CONSENT_KEY = "cookie_consent_v2";
/** The footer's "Çerez Tercihleri" asks the banner to open again with this event. */
export const CONSENT_OPEN_EVENT = "cookie-consent:open";
const CONSENT_CHANGE_EVENT = "cookie-consent:change";

export type ConsentChoice = "granted" | "denied";

/** Google Consent Mode v2's four signals, all one way. */
export function consentSignals(choice: ConsentChoice) {
  return { analytics_storage: choice, ad_storage: choice, ad_user_data: choice, ad_personalization: choice };
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** The stored choice, or null when the visitor has not made one (or storage is unavailable). */
export function readConsent(): ConsentChoice | null {
  try {
    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null");
    return stored?.choice === "granted" || stored?.choice === "denied" ? stored.choice : null;
  } catch {
    return null;
  }
}

/** Google Analytics' own cookies, on this host and its parent domain, when consent is taken back. */
function clearAnalyticsCookies() {
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((name) => name === "_gid" || name === "_gat" || name === "_ga" || name.startsWith("_ga_"));
  const host = location.hostname;
  const domains = ["", host, `.${host.split(".").slice(-2).join(".")}`, `.${host}`];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

/** Save the choice, tell the Google tag at once, and let the banner know. */
export function saveConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
  } catch {
    // Private mode / storage off: the choice holds for this page only.
  }
  window.gtag?.("consent", "update", consentSignals(choice));
  if (choice === "denied") clearAnalyticsCookies();
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

/** useSyncExternalStore's subscribe: this tab's saves and other tabs' (the storage event). */
export function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/**
 * The Google tag's first lines, run before gtag.js: Consent Mode v2's
 * defaults (everything denied), the visitor's earlier "Tümünü Kabul Et"
 * applied straight after, and only then `config`. `id` is checked as G-XXXX
 * by lib/analytics before it reaches here.
 */
export function gtagInitScript(id: string): string {
  const denied = JSON.stringify(consentSignals("denied"));
  const granted = JSON.stringify(consentSignals("granted"));
  return [
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}",
    `gtag('consent','default',${denied});`,
    `try{var c=JSON.parse(localStorage.getItem(${JSON.stringify(CONSENT_KEY)})||'null');if(c&&c.choice==='granted')gtag('consent','update',${granted});}catch(e){}`,
    `gtag('js',new Date());gtag('config','${id}');`,
    // Events fired before this ran (lib/gaEvents' queue), after config so the consent defaults precede them.
    "(window.__gaq||[]).forEach(function(a){gtag.apply(null,a);});window.__gaq=[];",
  ].join("");
}
