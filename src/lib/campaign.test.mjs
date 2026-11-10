// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { campaignBannerLive } from "./campaign.ts";

test("the 11.11 banner is up through 15 November, 23:59:59 Istanbul time", () => {
  assert.equal(campaignBannerLive(Date.parse("2026-11-10T12:00:00+03:00")), true);
  assert.equal(campaignBannerLive(Date.parse("2026-11-15T23:59:59+03:00")), true);
  // The same second as UTC: 20:59:59, three hours earlier than midnight there.
  assert.equal(campaignBannerLive(Date.parse("2026-11-15T20:59:59Z")), true);
});

test("the 11.11 banner is gone from midnight on 16 November in Istanbul", () => {
  assert.equal(campaignBannerLive(Date.parse("2026-11-16T00:00:00+03:00")), false);
  assert.equal(campaignBannerLive(Date.parse("2026-11-15T21:00:00Z")), false);
  assert.equal(campaignBannerLive(Date.parse("2027-11-11T12:00:00+03:00")), false);
});
