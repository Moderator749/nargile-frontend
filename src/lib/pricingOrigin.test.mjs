// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { appliedState, originOf, placeOf } from "./pricingOrigin.ts";

test("a row's application: none, as it stands, or its earlier version's", () => {
  assert.equal(appliedState({ applied_at: null, updated_at: "2026-11-03T10:00:00Z" }), "none");
  assert.equal(appliedState({ applied_at: "2026-11-03T10:00:01Z", updated_at: "2026-11-03T10:00:00Z" }), "current");
  assert.equal(appliedState({ applied_at: "2026-11-03T10:00:00Z", updated_at: "2026-11-03T10:00:00Z" }), "current");
  assert.equal(appliedState({ applied_at: "2026-11-03T10:00:00Z", updated_at: "2026-11-03T11:30:00Z" }), "earlier");
  // Microseconds and offsets as the API writes them.
  assert.equal(appliedState({ applied_at: "2026-11-03T10:00:00.123456+00:00", updated_at: "2026-11-03T13:00:00.5+03:00" }), "earlier");
});

test("a saved row as the calculator's origin, and where it is", () => {
  const draft = originOf({ id: "a", product_code: "ABC", product_name: "Gövde", file_id: null, file_name: null });
  assert.deepEqual(draft, { id: "a", code: "ABC", name: "Gövde", fileId: null, fileName: null });
  assert.equal(placeOf(draft), "Taslaklar");
  assert.equal(placeOf({ fileName: "Bayi Ekim 2026" }), "“Bayi Ekim 2026” dosyası");
});
