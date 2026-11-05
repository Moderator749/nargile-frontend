// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { appliedState, originOf, savesOver } from "./pricingOrigin.ts";

test("a row's application: none, as it stands, or its earlier version's", () => {
  assert.equal(appliedState({ applied_at: null, updated_at: "2026-11-03T10:00:00Z" }), "none");
  assert.equal(appliedState({ applied_at: "2026-11-03T10:00:01Z", updated_at: "2026-11-03T10:00:00Z" }), "current");
  assert.equal(appliedState({ applied_at: "2026-11-03T10:00:00Z", updated_at: "2026-11-03T10:00:00Z" }), "current");
  assert.equal(appliedState({ applied_at: "2026-11-03T10:00:00Z", updated_at: "2026-11-03T11:30:00Z" }), "earlier");
  // Microseconds and offsets as the API writes them.
  assert.equal(appliedState({ applied_at: "2026-11-03T10:00:00.123456+00:00", updated_at: "2026-11-03T13:00:00.5+03:00" }), "earlier");
});

test("a saved row as the calculator's origin", () => {
  const row = originOf({ id: "a", product_code: "ABC", product_name: "Gövde", file_id: 3, file_name: "Bayi Ekim 2026" });
  assert.deepEqual(row, { id: "a", code: "ABC", name: "Gövde", fileId: 3, fileName: "Bayi Ekim 2026" });
});

test("Kaydet writes over the loaded row only while its code is unchanged", () => {
  const loaded = { code: "NT10 G" };
  assert.equal(savesOver(loaded, "NT10 G"), true);
  assert.equal(savesOver(loaded, "  nt10 g "), true); // spaces and case aside, as the server compares
  assert.equal(savesOver(loaded, "NT10"), false); // changed: a new row (asked about if NT10 is saved)
  assert.equal(savesOver(null, "NT10 G"), false); // a new sheet
  assert.equal(savesOver({ code: "" }, ""), true); // a code-less row loaded and saved again
});
