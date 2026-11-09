// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { parseDecimalInput } from "./format.ts";
import { cellKey, gridChanges, normalized, verticalMove } from "./erpGrid.ts";

const saved = { [cellKey("p1", "DEALER")]: "100", [cellKey("p1", "RETAIL")]: "250.50" };
const read = (key) => saved[key] ?? null;

test("typed cells become changes; unchanged and empty-where-none are not", () => {
  const drafts = {
    [cellKey("p1", "DEALER")]: "100,00", // the same price, typed again
    [cellKey("p1", "RETAIL")]: "1.250,5",
    [cellKey("p1", "CAFE")]: "", // no price before, none now
    [cellKey("p2", "WHOLESALE")]: "75",
  };
  assert.deepEqual(gridChanges(drafts, read, parseDecimalInput), {
    changes: [
      { product_id: "p1", segment: "RETAIL", price: "1250.50" },
      { product_id: "p2", segment: "WHOLESALE", price: "75.00" },
    ],
    invalid: [],
  });
});

test("an emptied cell removes the price; a cell that is not a price holds the save", () => {
  const drafts = { [cellKey("p1", "DEALER")]: " ", [cellKey("p1", "RETAIL")]: "12,345", [cellKey("p3", "CAFE")]: "0" };
  assert.deepEqual(gridChanges(drafts, read, parseDecimalInput), {
    changes: [{ product_id: "p1", segment: "DEALER", price: null }],
    invalid: [cellKey("p1", "RETAIL"), cellKey("p3", "CAFE")],
  });
});

test("ids with dashes keep their shape; prices compare by value", () => {
  const id = "0b6c-4f2e";
  assert.deepEqual(gridChanges({ [cellKey(id, "CAFE")]: "5" }, () => null, parseDecimalInput).changes, [
    { product_id: id, segment: "CAFE", price: "5.00" },
  ]);
  assert.equal(normalized("7"), "7.00");
  assert.equal(normalized(null), null);
});

test("Enter moves down, Shift+Enter up, never off the grid", () => {
  assert.equal(verticalMove(0, 3, false), 1);
  assert.equal(verticalMove(2, 3, false), 2);
  assert.equal(verticalMove(0, 3, true), 0);
  assert.equal(verticalMove(2, 3, true), 1);
});
