// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { bulkBody, changeCount, emptyBulkDraft, parseQuantity } from "./categoryBulk.ts";

test("nothing chosen sends nothing", () => {
  const draft = emptyBulkDraft();
  assert.equal(changeCount(draft), 0);
  assert.deepEqual(bulkBody(draft), { error: "Uygulanacak bir ayar seçin." });
});

test("only the changed fields are sent, with their values", () => {
  const draft = emptyBulkDraft();
  draft.rules.gives_points = "no";
  draft.rules.is_free_shipping = "yes";
  draft.display.DEALER = "incl";
  draft.display.WHOLESALE = "excl";
  draft.display.RETAIL = "clear";
  draft.includeSubcategories = false;
  assert.equal(changeCount(draft), 5);
  assert.deepEqual(bulkBody(draft), {
    body: {
      include_subcategories: false,
      is_free_shipping: true,
      gives_points: false,
      erp_display_bayi: true,
      erp_display_toptan: false,
      erp_display_perakende: null,
    },
  });
});

test("adet şartı: dropped, set, or refused when it is not a whole number", () => {
  const draft = emptyBulkDraft();
  draft.minQuantity = { mode: "none" };
  assert.deepEqual(bulkBody(draft), { body: { include_subcategories: true, free_shipping_min_quantity: null } });
  draft.minQuantity = { mode: "set", value: " 12 " };
  assert.deepEqual(bulkBody(draft), { body: { include_subcategories: true, free_shipping_min_quantity: 12 } });
  for (const bad of ["", "0", "1,5", "abc", "1000000"]) {
    draft.minQuantity = { mode: "set", value: bad };
    assert.ok("error" in bulkBody(draft), bad);
  }
  assert.equal(parseQuantity("100000"), 100000);
});
