// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { heldToOnlineStock } from "./stockLimit.ts";

test("a branch or test account and an export account are not held to the online stock", () => {
  assert.equal(heldToOnlineStock({ account_type: "INDIVIDUAL", exclude_from_stock_and_reports: true }), false);
  assert.equal(heldToOnlineStock({ account_type: "TOBACCO_SHOP", exclude_from_stock_and_reports: true }), false);
  assert.equal(heldToOnlineStock({ account_type: "INTERNATIONAL" }), false);
});

test("everyone else is, a visitor included", () => {
  assert.equal(heldToOnlineStock({ account_type: "INDIVIDUAL" }), true);
  assert.equal(heldToOnlineStock({ account_type: "CAFE", exclude_from_stock_and_reports: false }), true);
  assert.equal(heldToOnlineStock(null), true);
  assert.equal(heldToOnlineStock(undefined), true);
});
