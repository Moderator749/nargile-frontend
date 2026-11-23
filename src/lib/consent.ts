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
    // Inside a frame — PayTR's, where the confirmation page opens for a moment
    // before it steps out to the top window — nothing is set up: no config, so
    // no page view and no session that starts at paytr.com. gtag.js then finds
    // an empty dataLayer and sends nothing. lib/gaEvents drops events there too.
    "if(window.top===window.self){",
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;",
    `gtag('consent','default',${denied});`,
    `try{var c=JSON.parse(localStorage.getItem(${JSON.stringify(CONSENT_KEY)})||'null');if(c&&c.choice==='granted')gtag('consent','update',${granted});}catch(e){}`,
    // A browser the shop's team has used the panel in is its own traffic
    // (lib/internalTraffic): GA4's "Internal traffic" data filter leaves it out.
    // `set` carries it on every event, the config on the page view itself.
    `var g={};try{if(localStorage.getItem(${JSON.stringify(INTERNAL_TRAFFIC_KEY)})==='1'){g.traffic_type='internal';gtag('set',g);}}catch(e){}`,
    `gtag('js',new Date());gtag('config','${id}',g);`,
    // Events fired before this ran (lib/gaEvents' queue), after config so the consent defaults precede them.
    "(window.__gaq||[]).forEach(function(a){gtag.apply(null,a);});window.__gaq=[];",
    "}",
  ].join("");
}

/**
 * Set in a browser once someone signs in to the admin panel there
 * (components/admin/AdminShell). Kept after signing out: the device is the
 * shop's, and its later storefront visits are still the team's own.
 */
export const INTERNAL_TRAFFIC_KEY = "ga_internal_traffic";

/** Marks this browser as the shop's own for GA4 (`traffic_type: internal`). */
export function markInternalTraffic(): void {
  try {
    localStorage.setItem(INTERNAL_TRAFFIC_KEY, "1");
  } catch {
    // Storage blocked: this visit is counted as a customer's; nothing breaks.
  }
}
