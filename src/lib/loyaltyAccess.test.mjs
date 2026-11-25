// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { adminLoyaltyView, showsWallet } from "./loyaltyAccess.ts";

const person = (segment_code, account_type = "INDIVIDUAL") => ({ account_type, segment_code });

test("an account on the Perakende price list sees the wallet, Bireysel or Kurumsal", () => {
  assert.equal(showsWallet(person("RETAIL"), { eligible: true }), true);
  assert.equal(showsWallet(person(null), null), true); // still loading: as its group says
  for (const tier of ["CAFE", "WHOLESALE", "DEALER"]) {
    assert.equal(showsWallet(person(tier), null), false, tier);
    assert.equal(showsWallet(person(tier), { eligible: true }), false, tier);
  }
  assert.equal(showsWallet(person("RETAIL"), { eligible: false }), false); // the server's word wins
  // The price list decides (2026-11-25): a Kurumsal account on Perakende keeps its wallet.
  assert.equal(showsWallet(person("RETAIL", "CAFE"), null), true);
  assert.equal(showsWallet(person("RETAIL", "TOBACCO_SHOP"), { eligible: true }), true);
  assert.equal(showsWallet(person("DEALER", "TOBACCO_SHOP"), null), false);
  assert.equal(showsWallet(person("RETAIL", "INTERNATIONAL"), null), false); // export: quotes, no points
  assert.equal(showsWallet(null, null), false);
});

test("the admin sees the tools, a notice, or a notice over old history", () => {
  assert.equal(adminLoyaltyView({ loyalty_eligible: true, loyalty_history: true }), "active");
  assert.equal(adminLoyaltyView({}), "active"); // an older server: as before
  assert.equal(adminLoyaltyView({ loyalty_eligible: false, loyalty_history: false }), "off");
  assert.equal(adminLoyaltyView({ loyalty_eligible: false, loyalty_history: true }), "off-with-history");
});
