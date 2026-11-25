// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { categoryTree, normalizeRoute, routeCovers } from "./accessRulesMath.ts";

test("a page rule's path is kept as the server keeps it", () => {
  assert.equal(normalizeRoute("/TR/Kampanyalar/"), "/kampanyalar");
  assert.equal(normalizeRoute("en/firsat-urunleri?x=1#y"), "/firsat-urunleri");
  assert.equal(normalizeRoute("/ar"), "/");
  assert.equal(normalizeRoute(""), "/");
});

test("a rule covers its page and the pages under it, nothing else", () => {
  assert.ok(routeCovers("/firsat-urunleri", "/firsat-urunleri"));
  assert.ok(routeCovers("/firsat-urunleri", "/en/firsat-urunleri/sayfa-2"));
  assert.ok(!routeCovers("/firsat-urunleri", "/firsat-urunleri-eski"));
  assert.ok(!routeCovers("/", "/anything")); // the home page is never a rule
});

test("categories come in tree order with their depth", () => {
  const tree = categoryTree([
    { id: 3, name: "Alt", parent_id: 1, is_active: true },
    { id: 1, name: "Üst", parent_id: null, is_active: true },
    { id: 2, name: "Diğer", parent_id: null, is_active: true },
    { id: 4, name: "Yetim", parent_id: 99, is_active: true },
  ]);
  assert.deepEqual(tree.map((c) => [c.id, c.depth]), [[1, 0], [3, 1], [2, 0], [4, 0]]);
});

test("an editor's set is unchanged whatever its order", async () => {
  const { sameRules, customerLabel } = await import("./accessRulesMath.ts");
  assert.ok(sameRules({ category_ids: [2, 1], brand_ids: [], routes: ["/b", "/a"] }, { category_ids: [1, 2], brand_ids: [], routes: ["/a", "/b"] }));
  assert.ok(!sameRules({ category_ids: [1], brand_ids: [], routes: [] }, { category_ids: [1], brand_ids: [3], routes: [] }));
  assert.equal(customerLabel({ company_title: "KARMA İÇECEK", full_name: "Ali", email: "a@b.c" }), "KARMA İÇECEK");
  assert.equal(customerLabel({ company_title: null, full_name: null, email: "a@b.c" }), "a@b.c");
});
