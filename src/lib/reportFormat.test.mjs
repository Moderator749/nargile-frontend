// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { formatChange, formatPercent, formatPoints, marginLevel, trendOf } from "./reportFormat.ts";

test("percents are written the Turkish way, a missing one as a dash", () => {
  assert.equal(formatPercent("44.8"), "%44,8");
  assert.equal(formatPercent("100"), "%100,0");
  assert.equal(formatPercent("-3.5"), "−%3,5");
  assert.equal(formatPercent(null), "—");
});

test("a change is signed, and a margin moves in points", () => {
  assert.equal(formatChange("335.0"), "+%335,0");
  assert.equal(formatChange("-12.25"), "−%12,3");
  assert.equal(formatChange("0"), "±%0,0");
  assert.equal(formatChange(null), null);
  assert.equal(formatPoints("-5.2"), "−5,2 puan");
  assert.equal(formatPoints("2"), "+2,0 puan");
  assert.equal(trendOf("-0.1"), "down");
  assert.equal(trendOf(null), null);
});

test("a margin is low under the threshold and near within five points of it", () => {
  assert.equal(marginLevel("14.9", 15), "low");
  assert.equal(marginLevel("15.0", 15), "near");
  assert.equal(marginLevel("19.9", 15), "near");
  assert.equal(marginLevel("20.0", 15), "ok");
  assert.equal(marginLevel(null, 15), null);
});
