// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { adminLoyaltyView, showsWallet } from "./loyaltyAccess.ts";

const person = (segment_code, account_type = "INDIVIDUAL") => ({ account_type, segment_code });

test("only a bireysel Perakende account sees the wallet", () => {
  assert.equal(showsWallet(person("RETAIL"), { eligible: true }), true);
  assert.equal(showsWallet(person(null), null), true); // still loading: as its group says
  for (const tier of ["CAFE", "WHOLESALE", "DEALER"]) {
    assert.equal(showsWallet(person(tier), null), false, tier);
    assert.equal(showsWallet(person(tier), { eligible: true }), false, tier);
  }
  assert.equal(showsWallet(person("RETAIL"), { eligible: false }), false); // the server's word wins
  assert.equal(showsWallet(person("RETAIL", "CAFE"), null), false); // a firm on retail prices
  assert.equal(showsWallet(null, null), false);
});

test("the admin sees the tools, a notice, or a notice over old history", () => {
  assert.equal(adminLoyaltyView({ loyalty_eligible: true, loyalty_history: true }), "active");
  assert.equal(adminLoyaltyView({}), "active"); // an older server: as before
  assert.equal(adminLoyaltyView({ loyalty_eligible: false, loyalty_history: false }), "off");
  assert.equal(adminLoyaltyView({ loyalty_eligible: false, loyalty_history: true }), "off-with-history");
});
