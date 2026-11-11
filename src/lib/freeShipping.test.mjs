// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { shippingState } from "./freeShipping.ts";

const params = { free_shipping_threshold: "3000.00", coal_max_ratio: "0.50" };
const empty = { amount: 0, coal: 0 };

test("a set over the threshold ships free on its own", () => {
  assert.deepEqual(shippingState({ amount: 12500, coal: false }, empty, params), { kind: "free_here" });
});

test("a bowl under the threshold says how much is left to add", () => {
  assert.deepEqual(shippingState({ amount: 853.37, coal: false }, empty, params), { kind: "to_free", remaining: 2146.63 });
});

test("the cart counts: a bowl with a set already in it ships free with the cart", () => {
  assert.deepEqual(shippingState({ amount: 700, coal: false }, { amount: 2500, coal: 0 }, params), { kind: "free_with_cart" });
});

test("a coal-heavy cart is never promised free shipping, even over the threshold", () => {
  // Coal 3,600 of 3,600: over the 50% rule; free only from the coal minimum, which needs the weights.
  assert.deepEqual(shippingState({ amount: 3600, coal: true }, empty, params), { kind: "coal", remaining: 0 });
  // A bowl added to a cart that is mostly coal.
  assert.deepEqual(shippingState({ amount: 500, coal: false }, { amount: 2000, coal: 2000 }, params), { kind: "coal", remaining: 500 });
});

test("a little coal in a big cart does not hold free shipping back", () => {
  assert.deepEqual(shippingState({ amount: 400, coal: true }, { amount: 5000, coal: 0 }, params), { kind: "free_with_cart" });
});

test("exactly at the threshold is free, as checkout has it (subtotal >= threshold)", () => {
  assert.deepEqual(shippingState({ amount: 3000, coal: false }, empty, params), { kind: "free_here" });
});
