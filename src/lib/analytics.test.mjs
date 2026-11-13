import assert from "node:assert/strict";
import { test } from "node:test";

import { measurementId } from "./analytics.ts";

const SHOP = { NODE_ENV: "production", NEXT_PUBLIC_ALLOW_INDEXING: "true" };

test("the shop's own server measures without any Vercel variable", () => {
  assert.equal(measurementId(SHOP), "G-7HMNRFXKN7");
});

test("a self-hosted build that is not the indexed shop does not", () => {
  assert.equal(measurementId({ NODE_ENV: "production" }), null); // local next build, staging
  assert.equal(measurementId({ NODE_ENV: "development", NEXT_PUBLIC_ALLOW_INDEXING: "true" }), null); // next dev
});

test("on Vercel, only the production deployment measures", () => {
  assert.equal(measurementId({ VERCEL_ENV: "production", NODE_ENV: "production" }), "G-7HMNRFXKN7");
  assert.equal(measurementId({ ...SHOP, VERCEL_ENV: "preview" }), null);
});

test("a configured ID is used, a malformed one refused", () => {
  assert.equal(measurementId({ ...SHOP, NEXT_PUBLIC_GA_MEASUREMENT_ID: " G-ABC123 " }), "G-ABC123");
  assert.equal(measurementId({ ...SHOP, NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-1');alert(1)//" }), null);
});
