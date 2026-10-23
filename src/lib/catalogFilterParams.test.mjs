// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { filtersFromParams, filtersToParams } from "./catalogFilterParams.ts";

const EMPTY = { min: "", max: "", inStock: false, sort: "recommended" };

test("filters go into the address and come back out the same", () => {
  const filters = { min: "7000", max: "8.000", inStock: true, sort: "price-asc" };
  const params = filtersToParams(filters, new URLSearchParams("q=lule"));
  assert.equal(params.toString(), "q=lule&min=7000&max=8.000&stok=1&sort=price-asc");
  assert.deepEqual(filtersFromParams(params), filters);
});

test("the defaults leave the address clean", () => {
  const params = filtersToParams(EMPTY, new URLSearchParams("q=lule&min=5&sort=name-asc&stok=1"));
  assert.equal(params.toString(), "q=lule");
});

test("anything unreadable in an address is no filter", () => {
  assert.deepEqual(filtersFromParams(new URLSearchParams("min=abc&max=<script>&sort=cheapest&stok=yes")), EMPTY);
});
