// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { schemaSku } from "./schemaSku.ts";

test("spaces in a product code become single hyphens", () => {
  assert.equal(schemaSku("STEAM 91-1"), "STEAM-91-1");
  assert.equal(schemaSku("CSM 13"), "CSM-13");
  assert.equal(schemaSku("  Bobby 01-GOLD  BEYAZ "), "Bobby-01-GOLD-BEYAZ");
});

test("a clean code is unchanged and an empty one is left out", () => {
  assert.equal(schemaSku("LH013"), "LH013");
  assert.equal(schemaSku(""), undefined);
  assert.equal(schemaSku(null), undefined);
  assert.equal(schemaSku(undefined), undefined);
});
