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

test("sections the saved order lacks go straight before the one they precede by default", () => {
  // Saved before "kozlukler" and "games" existed, the bento moved to the top.
  const saved = HOME_BLOCKS.filter((id) => id !== "kozlukler" && id !== "games" && id !== "showcase");
  const order = resolveBlockOrder(["showcase", ...saved]);
  assert.deepEqual(order.slice(0, 3), ["kozlukler", "games", "showcase"]);
  assert.equal(order.length, HOME_BLOCKS.length);
  // The last by default goes last when it is missing.
  assert.equal(resolveBlockOrder(HOME_BLOCKS.slice(0, -1)).at(-1), "about");
});

test("an order saved before the second showcase puts it between SultanPuan and Kumbara", () => {
  // The live order on 2026-10-26, from before "bento2" existed.
  const saved = ["perks", "brands_top", "picks", "lules", "sultanpuan", "kumbara", "bento", "deals", "campaigns", "promos", "brands", "games", "kozlukler", "brand_showcase", "showcase", "about"];
  const order = resolveBlockOrder(saved);
  assert.deepEqual(order.slice(4, 8), ["sultanpuan", "bento2", "kumbara", "bento"]);
  assert.deepEqual(order.filter((id) => id !== "bento2"), saved.map((id) => (id === "campaigns" ? "bento3" : id)));
});

test("the campaign boxes hand their place to the third showcase", () => {
  // The live order on 2026-10-27, as an API from before the change still sends it.
  const saved = ["perks", "brands_top", "picks", "lules", "bento", "kumbara", "sultanpuan", "bento2", "deals", "campaigns", "promos", "brands", "games", "kozlukler", "brand_showcase", "showcase", "about"];
  const order = resolveBlockOrder(saved);
  assert.deepEqual(order, saved.map((id) => (id === "campaigns" ? "bento3" : id)));
  assert.equal(order.includes("campaigns"), false);
  // Saved with both (never by this editor): the showcase once, where it was.
  const both = resolveBlockOrder(["deals", "bento3", "campaigns"]);
  assert.equal(both.filter((id) => id === "bento3").length, 1);
  assert.equal(both.indexOf("bento3"), both.indexOf("deals") + 1);
});
