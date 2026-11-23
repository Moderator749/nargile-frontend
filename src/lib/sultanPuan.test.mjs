// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { sultanPuanPercent } from "./sultanPuan.ts";

// "Parametreler" as it is set live: 10% for orders of 20.000–29.999,99 TL.
const LIVE = { enabled: true, base_rate: "0.1000", band_min: "20000.00", band_max: "29999.99" };

test("a price inside the band earns the rate, both ends included", () => {
  assert.equal(sultanPuanPercent("20000.00", LIVE), 10);
  assert.equal(sultanPuanPercent("24500.00", LIVE), 10);
  assert.equal(sultanPuanPercent("29999.99", LIVE), 10);
  assert.equal(sultanPuanPercent(29999, LIVE), 10);
});

test("outside the band, nothing", () => {
  assert.equal(sultanPuanPercent("19999.99", LIVE), null);
  assert.equal(sultanPuanPercent("30000.00", LIVE), null);
  assert.equal(sultanPuanPercent("1164.00", LIVE), null);
});

test("no price, the programme off, or a zero rate: nothing", () => {
  assert.equal(sultanPuanPercent(null, LIVE), null);
  assert.equal(sultanPuanPercent(undefined, LIVE), null);
  assert.equal(sultanPuanPercent("", LIVE), null);
  assert.equal(sultanPuanPercent("25000.00", { ...LIVE, enabled: false }), null);
  assert.equal(sultanPuanPercent("25000.00", { ...LIVE, base_rate: "0" }), null);
  assert.equal(sultanPuanPercent("25000.00", null), null);
});

test("a different band and rate from the panel are followed as set", () => {
  const other = { enabled: true, base_rate: "0.075", band_min: "10000", band_max: "14999.99" };
  assert.equal(sultanPuanPercent("12000", other), 7.5);
  assert.equal(sultanPuanPercent("25000", other), null);
});
