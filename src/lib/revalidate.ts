import { coalesce } from "@/lib/coalesce";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * How long the panel waits after the last edit before refreshing the
 * storefront, and the longest it waits while edits keep coming. Every refresh
 * drops the whole catalog cache, and each page drawn again after it is billed
 * as a cache write (Vercel ISR Writes): a price list saved row by row used to
 * drop it every few seconds, the bulk of the November 2026 bill.
 */
const QUIET_MS = 60_000;
const MAX_WAIT_MS = 10 * 60_000;

/** The refresh itself; `keepalive` lets it finish while the tab closes. */
function post(): void {
  const token = useAuthStore.getState().token;
  if (!token) return;
  fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {
    // Ignored: the change still shows within the day-long cache window.
  });
}

const pending =
  typeof window === "undefined"
    ? null
    : coalesce(post, QUIET_MS, MAX_WAIT_MS, {
        now: () => Date.now(),
        setTimeout: (fn, ms) => window.setTimeout(fn, ms),
        clearTimeout: (handle) => window.clearTimeout(handle as number),
      });

if (typeof window !== "undefined") {
  // Leaving the panel (tab closed, hidden, navigated away): refresh now.
  window.addEventListener("pagehide", () => pending?.flush());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") pending?.flush();
  });
}

/**
 * Ask the storefront to drop its cached catalog/menu/brands after an admin
 * edit — once for a run of edits: a minute after the last (at most ten after
 * the first), or at once when the admin leaves the tab.
 * Best effort: if it fails, the change still shows within the day-long cache window.
 */
export async function refreshStorefront(): Promise<void> {
  pending?.request();
}
