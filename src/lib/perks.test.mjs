// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { loyaltyPerks, retailPerks } from "./perks.ts";

const account = (account_type, segment_code) => ({ account_type, segment_code });

test("Sultan Puan and Kumbara go by the price list alone", () => {
  for (const type of ["INDIVIDUAL", "CAFE", "TOBACCO_SHOP", "COMPANY", "SOLE_PROPRIETOR"]) {
    assert.equal(loyaltyPerks(account(type, "RETAIL")), true, `${type} on Perakende`);
    assert.equal(loyaltyPerks(account(type, null)), true, `${type}, no list yet: Perakende`);
    for (const tier of ["CAFE", "WHOLESALE", "DEALER"]) assert.equal(loyaltyPerks(account(type, tier)), false, `${type} on ${tier}`);
  }
  assert.equal(loyaltyPerks(account("INTERNATIONAL", "RETAIL")), false); // export: quotes, no points
  assert.equal(loyaltyPerks(null), false);
});

test("the cart discounts stay a bireysel Perakende account's", () => {
  assert.equal(retailPerks(account("INDIVIDUAL", "RETAIL")), true);
  assert.equal(retailPerks(account("CAFE", "RETAIL")), false);
  assert.equal(retailPerks(account("INDIVIDUAL", "DEALER")), false);
});
