// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { estimateCart } from "./cartEstimate.ts";

const params = {
  free_shipping_threshold: "3000.00",
  volume_tiers: [
    { threshold: "50000.00", rate: "0.08" },
    { threshold: "30000.00", rate: "0.05" },
  ],
};

test("below the first tier: no discount, the way to free shipping", () => {
  const e = estimateCart(1190, params);
  assert.equal(e.volumeDiscount, 0);
  assert.equal(e.total, 1190);
  assert.equal(e.freeShipping, false);
  assert.equal(e.toFreeShipping, 1810);
  assert.deepEqual(e.nextTier, { threshold: 30000, rate: 0.05, remaining: 28810 });
});

test("the highest tier reached gives its rate; the threshold itself counts", () => {
  assert.equal(estimateCart(30000, params).volumeRate, 0.05);
  const e = estimateCart(33874, params);
  assert.equal(e.volumeDiscount, 1693.7);
  assert.equal(e.total, 32180.3);
  assert.equal(e.freeShipping, true);
  assert.equal(e.toFreeShipping, 0);
  assert.equal(e.nextTier.threshold, 50000);
  const top = estimateCart(60000, params);
  assert.equal(top.volumeRate, 0.08);
  assert.equal(top.nextTier, null);
});
