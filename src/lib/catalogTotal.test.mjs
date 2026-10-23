// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { listingTotal } from "./catalogTotal.ts";

test("a page of a longer listing is counted against the whole", () => {
  assert.equal(listingTotal({ total: 312, loaded: 48, shown: 48, hasMore: true }), 312);
});

test("a listing that fits on one page is just its count", () => {
  assert.equal(listingTotal({ total: 17, loaded: 17, shown: 17, hasMore: false }), null);
});

test("no total before the API has said, nor once a filter narrows the grid", () => {
  assert.equal(listingTotal({ total: null, loaded: 48, shown: 48, hasMore: true }), null);
  assert.equal(listingTotal({ total: 312, loaded: 48, shown: 12, hasMore: true }), null);
});
