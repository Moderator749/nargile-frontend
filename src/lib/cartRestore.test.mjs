// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { withRestored } from "./cartRestore.ts";

const line = (id, quantity = 1) => ({ variant_id: id, quantity, product_name: id });

test("a removed line goes back where it was, at its quantity", () => {
  const cart = [line("a"), line("c")];
  assert.deepEqual(
    withRestored(cart, line("b", 4), 1).map((i) => [i.variant_id, i.quantity]),
    [["a", 1], ["b", 4], ["c", 1]],
  );
});

test("a position past the end puts it last", () => {
  assert.deepEqual(withRestored([line("a")], line("b"), 9).map((i) => i.variant_id), ["a", "b"]);
});

test("a line already back in the cart is left as it is", () => {
  const cart = [line("a"), line("b", 2)];
  assert.equal(withRestored(cart, line("b", 5), 0), cart);
});
