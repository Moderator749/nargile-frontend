// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ancestorsOf,
  canPlaceUnder,
  categoryFamily,
  categoryTree,
  flattenTree,
  pathOf,
  rootOf,
  subtreeIds,
} from "./categoryTree.ts";

const cat = (id, name, parent_id = null, product_count = 1, sort_order = 0) => ({
  id, name, slug: name.toLowerCase().replaceAll(" ", "-"), parent_id, product_count, sort_order,
});
// Nargile Takımları > Oduman Nargile > (Oduman Lüleler, Oduman Hortumlar); > Mya Nargile; Kömür alone.
const CATS = [
  cat(1, "Nargile Takımları"),
  cat(2, "Oduman Nargile", 1),
  cat(3, "Oduman Lüleler", 2, 4, 1),
  cat(4, "Oduman Hortumlar", 2, 2, 0),
  cat(5, "Mya Nargile", 1),
  cat(6, "Kömür"),
  cat(7, "Boş Alt", 6, 0),
];
const byId = (id) => CATS.find((c) => c.id === id);

test("the tree nests three levels, each in menu order", () => {
  const tree = categoryTree(CATS);
  assert.deepEqual(tree.map((g) => g.name), ["Kömür", "Nargile Takımları"]);
  const oduman = tree[1].children.find((c) => c.id === 2);
  assert.deepEqual(oduman.children.map((c) => c.name), ["Oduman Hortumlar", "Oduman Lüleler"]);
  assert.deepEqual(
    flattenTree(tree).map(({ category, depth }) => `${depth}:${category.id}`),
    ["0:6", "1:7", "0:1", "1:5", "1:2", "2:4", "2:3"],
  );
});

test("a loop in the data ends instead of recursing", () => {
  const tree = categoryTree([cat(1, "A"), cat(2, "B", 3), cat(3, "C", 2)]);
  assert.deepEqual(tree.map((g) => g.id), [1]);
  assert.deepEqual(ancestorsOf(cat(2, "B", 3), [cat(2, "B", 3), cat(3, "C", 2)]).map((c) => c.id), [3]);
});

test("ancestors, root, path and subtree", () => {
  assert.deepEqual(ancestorsOf(byId(3), CATS).map((c) => c.id), [1, 2]);
  assert.deepEqual(ancestorsOf(byId(1), CATS), []);
  assert.equal(rootOf(byId(3), CATS).id, 1);
  assert.equal(rootOf(byId(6), CATS).id, 6);
  assert.equal(pathOf(byId(3), CATS), "Nargile Takımları › Oduman Nargile › Oduman Lüleler");
  assert.deepEqual(subtreeIds(1, CATS).sort(), [1, 2, 3, 4, 5]);
});

test("placement follows the backend: three levels, never into one's own branch", () => {
  assert.equal(canPlaceUnder(null, 2, CATS), true); // a third level
  assert.equal(canPlaceUnder(null, 3, CATS), false); // a fourth
  assert.equal(canPlaceUnder(6, 1, CATS), true); // Kömür (with Boş Alt) under a group: two levels below it
  assert.equal(canPlaceUnder(6, 2, CATS), false); // one level lower: four
  assert.equal(canPlaceUnder(1, 6, CATS), false); // a three-level branch under anything
  assert.equal(canPlaceUnder(2, 3, CATS), false); // into its own branch
  assert.equal(canPlaceUnder(2, 2, CATS), false);
  assert.equal(canPlaceUnder(5, 2, CATS), true); // a leaf moves to the third level
});

test("chips: a category's own stocked children, else its neighbours", () => {
  // Group: its subcategories, "Tümü" itself (as before).
  const group = categoryFamily(byId(1), CATS);
  assert.equal(group.group.id, 1);
  assert.deepEqual(group.members.map((c) => c.id), [5, 2]); // same order: by name
  // Level 2 with children: the children, "Tümü" itself.
  const brand = categoryFamily(byId(2), CATS);
  assert.equal(brand.group.id, 2);
  assert.deepEqual(brand.members.map((c) => c.name), ["Oduman Hortumlar", "Oduman Lüleler"]);
  // Level 2 without children: its neighbours, "Tümü" the group (as before).
  const mya = categoryFamily(byId(5), CATS);
  assert.equal(mya.group.id, 1);
  // Level 3: its neighbours, "Tümü" the level-2 parent.
  const bowls = categoryFamily(byId(3), CATS);
  assert.equal(bowls.group.id, 2);
  assert.deepEqual(bowls.members.map((c) => c.id), [4, 3]);
  // Children with nothing listed count as none: Kömür's only child is empty.
  assert.equal(categoryFamily(byId(6), CATS), null);
});
