// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { isLocale, localePath, splitLocale } from "./config.ts";

test("Turkish keeps the root; English and Arabic get their prefix", () => {
  assert.equal(localePath("tr", "/catalog/luleler"), "/catalog/luleler");
  assert.equal(localePath("en", "/catalog/luleler"), "/en/catalog/luleler");
  assert.equal(localePath("ar", "/"), "/ar");
  assert.equal(localePath("en", "/catalog?q=lüle"), "/en/catalog?q=lüle");
});

test("what is not a storefront path is left alone", () => {
  for (const href of ["https://example.com/x", "#avantajlar", "mailto:a@b.c", "//cdn.example.com/a.png", "/admin", "/admin/orders", "/api/backend/x"])
    assert.equal(localePath("en", href), href, href);
  // Already in a language.
  assert.equal(localePath("en", "/ar/catalog"), "/ar/catalog");
});

test("a pathname says its language", () => {
  assert.deepEqual(splitLocale("/en/catalog/luleler"), { locale: "en", path: "/catalog/luleler" });
  assert.deepEqual(splitLocale("/ar"), { locale: "ar", path: "/" });
  assert.deepEqual(splitLocale("/catalog"), { locale: "tr", path: "/catalog" });
  // "/english-tea" is not English.
  assert.deepEqual(splitLocale("/english-tea"), { locale: "tr", path: "/english-tea" });
  assert.equal(isLocale("ar"), true);
  assert.equal(isLocale("fr"), false);
});
