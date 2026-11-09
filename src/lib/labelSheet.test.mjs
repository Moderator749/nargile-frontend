// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { cutEdges, parseOrderIds, sheetsOf } from "./labelSheet.ts";

test("one label lands in the chosen quarter; the ones before it are already cut", () => {
  assert.deepEqual(sheetsOf(["A"]), [[{ label: "A" }, null, null, null]]);
  assert.deepEqual(sheetsOf(["A"], 3), [["used", "used", { label: "A" }, null]]);
  assert.deepEqual(sheetsOf(["A"], 4), [["used", "used", "used", { label: "A" }]]);
});

test("a batch flows four to a sheet, filling a part-used sheet first", () => {
  const five = ["A", "B", "C", "D", "E"];
  assert.deepEqual(sheetsOf(five), [
    [{ label: "A" }, { label: "B" }, { label: "C" }, { label: "D" }],
    [{ label: "E" }, null, null, null],
  ]);
  assert.deepEqual(sheetsOf(five, 2), [
    ["used", { label: "A" }, { label: "B" }, { label: "C" }],
    [{ label: "D" }, { label: "E" }, null, null],
  ]);
  assert.equal(sheetsOf(["A", "B", "C", "D"]).length, 1);
  assert.deepEqual(sheetsOf([]), []);
});

test("cut guides run along the page's middle lines only", () => {
  assert.deepEqual(cutEdges(1), { top: false, right: true, bottom: true, left: false });
  assert.deepEqual(cutEdges(2), { top: false, right: false, bottom: true, left: true });
  assert.deepEqual(cutEdges(3), { top: true, right: true, bottom: false, left: false });
  assert.deepEqual(cutEdges(4), { top: true, right: false, bottom: false, left: true });
});

test("order ids from the query, in order, each once", () => {
  assert.deepEqual(parseOrderIds("a, b,,a,c"), ["a", "b", "c"]);
  assert.deepEqual(parseOrderIds(["a,b", "c"]), ["a", "b", "c"]);
  assert.deepEqual(parseOrderIds(undefined), []);
});
