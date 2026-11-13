// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { UNAVAILABLE, atRoot, oldProductTarget } from "./oldProduct.ts";

/** Lookups answering from fixed tables, recording what was asked. */
function lookups({ current = {}, retired = {}, shelf = {} } = {}, { withShelf = true } = {}) {
  const asked = [];
  const answer = (table, kind) => async (ref) => {
    asked.push(`${kind}:${ref}`);
    return ref in table ? table[ref] : null;
  };
  return {
    asked,
    current: answer(current, "current"),
    retired: (ref) => retired[ref],
    ...(withShelf ? { shelf: answer(shelf, "shelf") } : {}),
  };
}

test("a product renamed since: straight to its current slug", async () => {
  const l = lookups({ current: { "steamulation-hms-kozluk": "steam-91-1-steamulation-hms-kozluk" } });
  assert.equal(await oldProductTarget("steamulation-hms-kozluk", l), "/steam-91-1-steamulation-hms-kozluk");
  assert.deepEqual(l.asked, ["current:steamulation-hms-kozluk"]);
});

test("a retired product: its hand-picked successor, written at the root", async () => {
  const l = lookups({ retired: { "steamulation-ultimate-gen-3-nargile-takimi-gold-matt-1": "/catalog/steamulation" } });
  assert.equal(await oldProductTarget("steamulation-ultimate-gen-3-nargile-takimi-gold-matt-1", l), "/steamulation");
  assert.ok(!l.asked.some((a) => a.startsWith("shelf:")), "no shelf lookup once RETIRED_PRODUCTS answers");
});

test("a product taken off sale: its category, by the shelf lookup", async () => {
  const l = lookups({ shelf: { "led-nargile-sise-alti-led-buyuk": "led-isiklar" } });
  assert.equal(await oldProductTarget("led-nargile-sise-alti-led-buyuk", l), "/led-isiklar");
});

test("nothing known of it: null, the caller decides (the page's 404)", async () => {
  assert.equal(await oldProductTarget("cbb-p-basic-plus-lule", lookups()), null);
  assert.equal(await oldProductTarget("x", lookups({}, { withShelf: false })), null);
});

test("the API not answering: UNAVAILABLE, never a guessed permanent target", async () => {
  assert.equal(await oldProductTarget("a", lookups({ current: { a: UNAVAILABLE } })), UNAVAILABLE);
  assert.equal(await oldProductTarget("b", lookups({ shelf: { b: UNAVAILABLE } })), UNAVAILABLE);
});

test("old /product/ and /catalog/ spellings are written at the root", () => {
  assert.equal(atRoot("/product/mlz-202-sise-harbisi"), "/mlz-202-sise-harbisi");
  assert.equal(atRoot("/catalog/komurler"), "/komurler");
  assert.equal(atRoot("/komurler"), "/komurler");
});
