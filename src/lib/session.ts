// Sliding sessions: a visit renews the token, so a customer is signed out only
// after a whole session lifetime without one (30 days; a day for the panel's
// staff — the server decides by role). Client-side only.

import { api } from "@/lib/api";
import { getToken, setToken } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import type { Token } from "@/types";

/** Renewed at most this often: once an hour is plenty for a lifetime of days. */
const RENEW_AFTER_MS = 60 * 60 * 1000;

let inFlight: Promise<void> | null = null;

/** When the token was issued (its `iat`), in ms; null for one that cannot be read. */
function issuedAt(token: string): number | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { iat } = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "="))) as { iat?: number };
    return typeof iat === "number" ? iat * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Trades the current token for a fresh one when it is more than an hour old
 * (or older than this scheme and carries no issue time). A token the server no
 * longer accepts — expired, or ended by a password reset — gets a 401, and the
 * API client signs the visitor out as for any expired session.
 */
export function renewSession(): Promise<void> {
  const token = getToken();
  if (!token) return Promise.resolve();
  const iat = issuedAt(token);
  if (iat !== null && Date.now() - iat < RENEW_AFTER_MS) return Promise.resolve();
  inFlight ??= api
    .post<Token>("/auth/refresh")
    .then(({ data }) => {
      // Signed out meanwhile (another tab, the logout button): keep it that way.
      if (getToken() !== token) return;
      setToken(data.access_token);
      useAuthStore.setState({ token: data.access_token });
    })
    .catch(() => {
      // A 401 is handled by the API client; anything else (offline) waits for the next visit.
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
