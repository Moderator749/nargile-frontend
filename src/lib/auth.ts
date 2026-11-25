// JWT storage. Client-side only: every accessor is a no-op on the server.

export const TOKEN_KEY = "access_token";

const isBrowser = () => typeof window !== "undefined";

/**
 * Mirrors "has a token" onto <html data-auth> so CSS can mask public prices
 * until segment prices load (see globals.css and AUTH_HINT_SCRIPT).
 */
function syncAuthHint(loggedIn: boolean): void {
  if (loggedIn) document.documentElement.dataset.auth = "1";
  else delete document.documentElement.dataset.auth;
  try {
    document.cookie = loggedIn ? SIGNED_IN_COOKIE_SET : SIGNED_IN_COOKIE_CLEAR;
  } catch {
    // cookies blocked: the proxy treats the visitor as a guest
  }
}

/**
 * "Signed in" for the storefront's proxy (src/proxy.ts), which cannot read
 * localStorage: rules for visitors who are not signed in ("Grup Erişim
 * Kısıtlamaları", GUEST) are applied there only without it; a signed-in
 * visitor's own group is checked by the page with their token
 * (components/layout/AccessGate). It carries no identity — forged, it shows a
 * page's frame at most: the API still answers a request without a token as a
 * guest's.
 */
export const SIGNED_IN_COOKIE = "nm_auth";
const SIGNED_IN_COOKIE_SET = `${SIGNED_IN_COOKIE}=1; path=/; max-age=2592000; samesite=lax`;
const SIGNED_IN_COOKIE_CLEAR = `${SIGNED_IN_COOKIE}=; path=/; max-age=0; samesite=lax`;

/** Inline, pre-paint script for layout.tsx: same check as getToken(), and the signed-in cookie kept in step with it. */
export const AUTH_HINT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(TOKEN_KEY)})){document.documentElement.dataset.auth="1";document.cookie=${JSON.stringify(SIGNED_IN_COOKIE_SET)}}else if(document.cookie.indexOf(${JSON.stringify(SIGNED_IN_COOKIE + "=")})>-1){document.cookie=${JSON.stringify(SIGNED_IN_COOKIE_CLEAR)}}}catch(e){}`;

export function getToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private mode, blocked site data) — session stays anonymous.
  }
  syncAuthHint(true);
}

export function clearToken(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  syncAuthHint(false);
}
