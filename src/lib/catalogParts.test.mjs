// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { catalogParts, collectAllPages, partOf } from "./catalogParts.ts";

test("a listing up to one file's size is one part", () => {
  assert.deepEqual(catalogParts(118, 200), [{ n: 1, from: 1, to: 118 }]);
  assert.deepEqual(catalogParts(200, 200), [{ n: 1, from: 1, to: 200 }]);
  assert.deepEqual(catalogParts(0, 200), []);
});

test("a longer one is split in the grid's order, the last part taking the rest", () => {
  assert.deepEqual(catalogParts(356, 200), [
    { n: 1, from: 1, to: 200 },
    { n: 2, from: 201, to: 356 },
  ]);
  assert.deepEqual(catalogParts(879, 200).map((p) => `${p.from}–${p.to}`), ["1–200", "201–400", "401–600", "601–800", "801–879"]);
  assert.deepEqual(catalogParts(401, 200).at(-1), { n: 3, from: 401, to: 401 });
});

test("a part's items, and part 1 for a number that names none", () => {
  const ids = Array.from({ length: 5 }, (_, i) => `p${i + 1}`);
  assert.deepEqual(partOf(ids, 2, 2), { part: { n: 2, from: 3, to: 4 }, items: ["p3", "p4"] });
  assert.deepEqual(partOf(ids, 3, 2).items, ["p5"]);
  assert.deepEqual(partOf(ids, 9, 2).items, ["p1", "p2"]);
  assert.deepEqual(partOf([], 1, 2), { part: null, items: [] });
});

/** A listing of `size` products served `limit` at a time, recording what was asked. */
function listing(size) {
  const asked = [];
  const all = Array.from({ length: size }, (_, i) => ({ id: `p${i}` }));
  const fetchPage = async (skip, limit) => {
    asked.push(skip);
    return all.slice(skip, skip + limit);
  };
  return { all, asked, fetchPage };
}

test("every page is fetched at once when the count is known", async () => {
  const { all, asked, fetchPage } = listing(356);
  assert.deepEqual(await collectAllPages(fetchPage, 356, 100), all);
  assert.deepEqual(asked, [0, 100, 200, 300]);
});

test("a count that fell behind, or none at all, is followed until a short page", async () => {
  const grew = listing(250);
  assert.deepEqual((await collectAllPages(grew.fetchPage, 180, 100)).length, 250);
  assert.deepEqual(grew.asked, [0, 100, 200]);

  const uncounted = listing(200);
  assert.equal((await collectAllPages(uncounted.fetchPage, null, 100)).length, 200);
  assert.deepEqual(uncounted.asked, [0, 100, 200]);
});

test("a product met on two pages is kept once, where it came first", async () => {
  const pages = [[{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }], [{ id: "d" }]];
  const got = await collectAllPages(async (skip) => pages[skip / 2] ?? [], 6, 2);
  assert.deepEqual(got.map((p) => p.id), ["a", "b", "c", "d"]);
});
