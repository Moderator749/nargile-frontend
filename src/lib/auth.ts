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
}

/** Inline, pre-paint script for layout.tsx: same check as getToken(). */
export const AUTH_HINT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(TOKEN_KEY)}))document.documentElement.dataset.auth="1"}catch(e){}`;

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

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
