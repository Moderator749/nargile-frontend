// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";

import { ROOT_ROUTES, isProductPath } from "./rootRoutes.ts";

const pages = (dir) =>
  readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !/^[([]/.test(entry.name))
    .map((entry) => entry.name);

test("every page folder at the root is a reserved route, so no product slug can shadow it", () => {
  for (const name of [...pages("../app/[locale]/(storefront)/"), ...pages("../app/[locale]/"), ...pages("../app/[locale]/(admin)/")]) {
    assert.ok(ROOT_ROUTES.includes(name), `${name} is missing from ROOT_ROUTES`);
  }
});

test("a product's address is one segment that is not a page of the shop", () => {
  assert.equal(isProductPath("/oduman-n2-nargile-takimi"), true);
  assert.equal(isProductPath("/en/oduman-n2-nargile-takimi"), true);
  assert.equal(isProductPath("/mr.wood-nargile-takimi-prisma-zebrano"), true);
  assert.equal(isProductPath("/"), false);
  assert.equal(isProductPath("/en"), false);
  assert.equal(isProductPath("/cart"), false);
  assert.equal(isProductPath("/ar/blog"), false);
  assert.equal(isProductPath("/catalog/sultan"), false);
});
