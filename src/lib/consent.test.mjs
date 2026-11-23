// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { INTERNAL_TRAFFIC_KEY, gtagInitScript } from "./consent.ts";

/** Runs the init script in a pretend browser and returns what reached the dataLayer. */
function run({ framed = false, stored = {} } = {}) {
  const window = {};
  window.self = window;
  window.top = framed ? {} : window;
  const localStorage = { getItem: (key) => stored[key] ?? null };
  new Function("window", "localStorage", "dataLayer", `with (window) { ${gtagInitScript("G-TEST123")} }`)(
    window,
    localStorage,
    undefined,
  );
  return { window, calls: (window.dataLayer ?? []).map((args) => Array.from(args)) };
}

test("a normal page sets consent first, then config, and exposes gtag", () => {
  const { window, calls } = run();
  assert.equal(typeof window.gtag, "function");
  assert.deepEqual(calls[0].slice(0, 2), ["consent", "default"]);
  const config = calls.find((c) => c[0] === "config");
  assert.deepEqual(config, ["config", "G-TEST123", {}]);
  assert.ok(!calls.some((c) => c[0] === "set"));
});

test("inside PayTR's frame nothing is set up: no config, no page view", () => {
  const { window, calls } = run({ framed: true });
  assert.equal(window.gtag, undefined);
  assert.equal(window.dataLayer, undefined);
  assert.equal(calls.length, 0);
});

test("a browser the team used the panel in is tagged as internal traffic", () => {
  const { calls } = run({ stored: { [INTERNAL_TRAFFIC_KEY]: "1" } });
  assert.deepEqual(calls.find((c) => c[0] === "set"), ["set", { traffic_type: "internal" }]);
  assert.deepEqual(calls.find((c) => c[0] === "config"), ["config", "G-TEST123", { traffic_type: "internal" }]);
  // The tag before the config, so the page view carries it too.
  assert.ok(calls.findIndex((c) => c[0] === "set") < calls.findIndex((c) => c[0] === "config"));
});
