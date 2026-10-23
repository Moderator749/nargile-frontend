// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { applySavedOrder, isDefaultOrder } from "./savedOrder.ts";

const MENU = ["/admin", "/admin/orders", "/admin/products", "/admin/translations", "/admin/customers"];

test("nothing saved (or unreadable) is the default order", () => {
  assert.deepEqual(applySavedOrder(MENU, null), MENU);
  assert.deepEqual(applySavedOrder(MENU, []), MENU);
});

test("a saved order is kept as it was arranged", () => {
  const saved = ["/admin/customers", "/admin", "/admin/products", "/admin/orders", "/admin/translations"];
  assert.deepEqual(applySavedOrder(MENU, saved), saved);
});

test("items gone from the menu are dropped, repeats count once", () => {
  assert.deepEqual(applySavedOrder(MENU, ["/admin/gone", "/admin/orders", "/admin/orders", ...MENU]), [
    "/admin/orders",
    "/admin",
    "/admin/products",
    "/admin/translations",
    "/admin/customers",
  ]);
});

test("an item added since takes its default place, before what follows it", () => {
  const saved = ["/admin/customers", "/admin/orders", "/admin"]; // saved before products and translations existed
  assert.deepEqual(applySavedOrder(MENU, saved), [
    "/admin/products",
    "/admin/translations",
    "/admin/customers",
    "/admin/orders",
    "/admin",
  ]);
  // The last by default goes last.
  assert.deepEqual(applySavedOrder(MENU, MENU.slice(0, -1)).at(-1), "/admin/customers");
});

test("whether an order is the default", () => {
  assert.equal(isDefaultOrder(MENU, [...MENU]), true);
  assert.equal(isDefaultOrder(MENU, [...MENU].reverse()), false);
});
