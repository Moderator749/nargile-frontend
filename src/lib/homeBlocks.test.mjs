// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { HOME_BLOCKS, resolveBlockOrder } from "./homeBlocks.ts";

test("nothing saved is the default order", () => {
  assert.deepEqual(resolveBlockOrder(undefined), [...HOME_BLOCKS]);
  assert.deepEqual(resolveBlockOrder([]), [...HOME_BLOCKS]);
});

test("a full saved order is kept as it is", () => {
  const reversed = [...HOME_BLOCKS].reverse();
  assert.deepEqual(resolveBlockOrder(reversed), reversed);
});

test("unknown and repeated entries are dropped", () => {
  const order = resolveBlockOrder(["about", "hero", "about", "nope", ...HOME_BLOCKS]);
  assert.equal(order[0], "about");
  assert.equal(order.length, HOME_BLOCKS.length);
  assert.equal(new Set(order).size, HOME_BLOCKS.length);
});

test("a section the saved order lacks goes back after the one it follows by default", () => {
  // Saved before "kumbara" existed, with the deals moved to the top.
  const saved = HOME_BLOCKS.filter((id) => id !== "kumbara" && id !== "deals");
  const order = resolveBlockOrder(["deals", ...saved]);
  assert.equal(order[0], "deals");
  assert.equal(order[order.indexOf("sultanpuan") + 1], "kumbara");
  // The first by default goes first when it is missing.
  assert.equal(resolveBlockOrder(HOME_BLOCKS.slice(1))[0], "perks");
});
