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

test("Tümünü Kısıtla closes every branch by its root, every brand, every quick page — the group's left to it", async () => {
  const { allCategories, allBrands, allRoutes, restrictAll, clearAll } = await import("./accessRulesMath.ts");
  const cats = [
    { id: 1, name: "Üst", parent_id: null, is_active: true },
    { id: 2, name: "Alt", parent_id: 1, is_active: true },
    { id: 3, name: "Diğer", parent_id: null, is_active: false },
    { id: 4, name: "Yetim", parent_id: 99, is_active: true },
  ];
  const brands = [
    { id: 10, name: "Sultan", parent_id: null, is_active: true },
    { id: 11, name: "STEAMULATION", parent_id: null, is_active: true },
  ];
  const quick = ["/firsat-urunleri", "/fiyat-katalogu"];
  assert.deepEqual(allCategories(cats), [1, 3, 4]); // roots (and the orphan); 2 goes with 1
  assert.deepEqual(allCategories(cats, [3]), [1, 4]); // the group's own stays the group's
  assert.deepEqual(allBrands(brands, [11]), [10]);
  // A typed page stays; the quick ones are added once; the group's are not repeated.
  assert.deepEqual(allRoutes(["/ozel"], quick, ["/fiyat-katalogu"]), ["/ozel", "/firsat-urunleri"]);
  assert.deepEqual(allRoutes(["/firsat-urunleri"], quick), ["/firsat-urunleri", "/fiyat-katalogu"]);

  const current = { category_ids: [2], brand_ids: [], routes: ["/ozel"] };
  const group = { category_ids: [3], brand_ids: [11], routes: ["/fiyat-katalogu"] };
  assert.deepEqual(restrictAll(current, cats, brands, quick, group), {
    category_ids: [1, 4],
    brand_ids: [10],
    routes: ["/ozel", "/firsat-urunleri"],
  });
  assert.deepEqual(restrictAll(current, cats, brands, quick), {
    category_ids: [1, 3, 4],
    brand_ids: [10, 11],
    routes: ["/ozel", "/firsat-urunleri", "/fiyat-katalogu"],
  });
  assert.deepEqual(clearAll(), { category_ids: [], brand_ids: [], routes: [] });
});
