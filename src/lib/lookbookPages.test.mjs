// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { PLATES_PER_PAGE, lookbookPages, pageLayout } from "./lookbookPages.ts";

const items = (n) => Array.from({ length: n }, (_, i) => `p${i + 1}`);
/** Each page as "layout:shape,shape…", for a compact comparison. */
const summary = (n) => lookbookPages(items(n)).map((p) => `${p.layout}:${p.slots.map((s) => s.shape).join(",")}`);

test("one product is a full-page showcase", () => {
  assert.deepEqual(summary(1), ["single:hero"]);
});

test("two products are two stacked half pages", () => {
  assert.deepEqual(summary(2), ["pair:wide,wide"]);
});

test("three products are two above and one full-width below", () => {
  assert.deepEqual(summary(3), ["trio:tall,tall,wide"]);
});

test("four products are a two-by-two grid", () => {
  assert.deepEqual(summary(4), ["quad:tall,tall,tall,tall"]);
});

test("five products: a full grid, then a full-page showcase for the last", () => {
  assert.deepEqual(summary(5), ["quad:tall,tall,tall,tall", "single:hero"]);
});

test("seven products: a full grid, then the three left over as two-over-one", () => {
  assert.deepEqual(summary(7), ["quad:tall,tall,tall,tall", "trio:tall,tall,wide"]);
});

test("every item lands on exactly one page, in order", () => {
  for (let n = 1; n <= 23; n++) {
    const pages = lookbookPages(items(n));
    assert.deepEqual(
      pages.flatMap((p) => p.slots.map((s) => s.item)),
      items(n),
    );
    assert.equal(pages.length, Math.ceil(n / PLATES_PER_PAGE));
    assert.ok(pages.every((p) => p.slots.length >= 1 && p.slots.length <= PLATES_PER_PAGE));
  }
});

test("no products, no pages", () => {
  assert.deepEqual(lookbookPages([]), []);
});

test("a page cannot hold more than four, or none", () => {
  assert.throws(() => pageLayout(0), RangeError);
  assert.throws(() => pageLayout(5), RangeError);
});
