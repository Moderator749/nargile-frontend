/**
 * Many calls, one run: `request()` schedules `run` for `quietMs` after the
 * latest call, but never later than `maxWaitMs` after the first unrun one;
 * `flush()` runs a pending one at once (a tab being closed). Nothing pending,
 * nothing runs.
 *
 * Built for the storefront refresh (lib/revalidate.ts): every refresh drops
 * the whole catalog cache, and every page then drawn again is billed as a
 * cache write — an admin saving a price list row by row used to drop it every
 * few seconds. Timers are handed in so the tests can drive the clock.
 */
export interface Timers {
  now: () => number;
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export function coalesce(run: () => void, quietMs: number, maxWaitMs: number, timers: Timers) {
  let firstAt: number | null = null;
  let handle: unknown = null;

  function fire() {
    if (handle !== null) timers.clearTimeout(handle);
    handle = null;
    firstAt = null;
    run();
  }

  return {
    request() {
      const now = timers.now();
      if (firstAt === null) firstAt = now;
      if (handle !== null) timers.clearTimeout(handle);
      const wait = Math.max(0, Math.min(quietMs, firstAt + maxWaitMs - now));
      handle = timers.setTimeout(fire, wait);
    },
    flush() {
      if (firstAt !== null) fire();
    },
    get pending() {
      return firstAt !== null;
    },
  };
}
