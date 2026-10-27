// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { canWiden, placeShowcase, showcaseProblem, showcaseSlotsUsed } from "./showcaseGrid.ts";

const S = { wide: false };
const W = { wide: true };
const spans = (tiles) => placeShowcase(tiles).map((s) => s.span);
const rows = (tiles) => placeShowcase(tiles).map((s) => s.row);

test("an unchecked box is one slot, wherever it stands", () => {
  // The live list: four squares, the first one no longer drawn wide.
  assert.deepEqual(spans([S, S, S, S]), [1, 1, 1, 1]);
  assert.deepEqual(rows([S, S, S, S, S]), [0, 0, 0, 0, 1]);
});

test("a wide box takes two slots, one to a row", () => {
  assert.deepEqual(spans([W, S, S, S, S, W]), [2, 1, 1, 1, 1, 2]);
  assert.deepEqual(rows([W, S, S, S, S, W]), [0, 0, 0, 1, 1, 1]);
  assert.equal(showcaseProblem([W, S, S, S, S, W]), null);
  assert.equal(showcaseProblem([S, S, S, S, S, S, S, S]), null);
});

test("two wide boxes in a row are refused, and drawn single", () => {
  const slots = placeShowcase([W, W]);
  assert.deepEqual(slots.map((s) => [s.span, s.narrowed]), [[2, false], [1, true]]);
  assert.match(showcaseProblem([W, W]), /2\. kutu geniş, ama 1\. satırda zaten bir geniş kutu var/);
});

test("a wide box with one slot left in its row is refused, never a hole", () => {
  assert.deepEqual(spans([S, S, S, W]), [1, 1, 1, 1]);
  assert.match(showcaseProblem([S, S, S, W]), /4\. kutu geniş, ama 1\. satırda iki boş yer kalmadı/);
});

test("more than two rows are refused", () => {
  assert.equal(showcaseSlotsUsed([W, S, S, S, S, W, S]), 9);
  assert.match(showcaseProblem([W, S, S, S, S, W, S]), /9 yer/);
  assert.match(showcaseProblem(Array(9).fill(S)), /9 yer/);
});

test("a box switched off takes no slot, and is named by its place in the list", () => {
  assert.equal(showcaseProblem([...Array(8).fill(S), { wide: false, enabled: false }]), null);
  assert.match(showcaseProblem([{ wide: true, enabled: false }, S, S, S, W]), /^5\. kutu/);
});

test("a box may be widened only where its row has room", () => {
  const tiles = [S, S, S, S, S];
  assert.equal(canWiden(tiles, 0), true);
  assert.equal(canWiden(tiles, 3), false); // fourth slot of row 1
  assert.equal(canWiden([W, S, S, S], 1), false); // row 1 already has its wide box
  assert.equal(canWiden([...Array(8).fill(S)], 0), false); // no slot to spare
});
