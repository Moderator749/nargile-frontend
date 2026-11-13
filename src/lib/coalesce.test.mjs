// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { coalesce } from "./coalesce.ts";

/** A hand-driven clock: `advance(ms)` runs every timer that falls due. */
function clock() {
  let now = 0;
  let next = 1;
  const timers = new Map();
  return {
    timers: {
      now: () => now,
      setTimeout: (fn, ms) => (timers.set(next, { fn, at: now + ms }), next++),
      clearTimeout: (id) => timers.delete(id),
    },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        now = due[1].at;
        due[1].fn();
      }
      now = end;
    },
  };
}

test("saves a few seconds apart make one refresh, after the last goes quiet", () => {
  const c = clock();
  let runs = 0;
  const r = coalesce(() => runs++, 60_000, 600_000, c.timers);
  for (let i = 0; i < 10; i++) {
    r.request();
    c.advance(6_000);
  }
  assert.equal(runs, 0);
  c.advance(60_000);
  assert.equal(runs, 1);
  c.advance(600_000);
  assert.equal(runs, 1, "nothing pending, nothing runs");
});

test("saving without pause still refreshes by the longest wait", () => {
  const c = clock();
  let runs = 0;
  const r = coalesce(() => runs++, 60_000, 600_000, c.timers);
  for (let t = 0; t < 1_200_000; t += 6_000) {
    r.request();
    c.advance(6_000);
  }
  assert.equal(runs, 2, "20 minutes of saves every 6 s: one refresh per 10 minutes");
});

test("flush runs a pending refresh at once, and only a pending one", () => {
  const c = clock();
  let runs = 0;
  const r = coalesce(() => runs++, 60_000, 600_000, c.timers);
  r.flush();
  assert.equal(runs, 0);
  r.request();
  assert.equal(r.pending, true);
  r.flush();
  assert.equal(runs, 1);
  assert.equal(r.pending, false);
  c.advance(120_000);
  assert.equal(runs, 1, "the cancelled timer does not run it again");
});
