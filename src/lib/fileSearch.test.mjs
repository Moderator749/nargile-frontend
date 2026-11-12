import assert from "node:assert/strict";
import { test } from "node:test";

import { codeHitLabel, fileHit } from "./fileSearch.ts";
import { foldSearch } from "./searchFold.ts";

// The same comparison RecordSearch uses: Turkish letters folded, case and separators aside.
const fold = (text) => foldSearch(text).replace(/[\s\-_.]/g, "");

test("a file is found by a code among its rows, whatever the case, spaces or hyphens", () => {
  const codes = ["Steam 09", "LA92-4", "LA92-45"];
  for (const q of ["steam09", "steam 09", "STEAM-09", "Steam 09"]) {
    assert.deepEqual(fileHit(q, "Közlükler", codes, fold), { byName: false, codes: ["Steam 09"] }, q);
  }
  for (const q of ["LA92-4", "la924", "la92 4"]) {
    assert.deepEqual(fileHit(q, "Közlükler", codes, fold)?.codes, ["LA92-4", "LA92-45"], q);
  }
});

test("the exact code comes first, then the closest", () => {
  assert.deepEqual(fileHit("la92", "X", ["LA92-45", "LA92", "LA92-4"], fold)?.codes, ["LA92", "LA92-4", "LA92-45"]);
});

test("Turkish letters fold in codes and names alike", () => {
  assert.deepEqual(fileHit("ŞİŞE 01", "X", ["sise01"], fold)?.codes, ["sise01"]);
  assert.equal(fileHit("kozluk", "Közlükler", [], fold)?.byName, true);
});

test("the name still finds a file; nothing found is null; an empty query keeps every file", () => {
  assert.deepEqual(fileHit("oduman", "Oduman", ["CB-01"], fold), { byName: true, codes: [] });
  assert.equal(fileHit("zzz", "Oduman", ["CB-01"], fold), null);
  assert.deepEqual(fileHit("  ", "Oduman", ["CB-01"], fold), { byName: true, codes: [] });
});

test("the card says the first matched code and how many more", () => {
  assert.equal(codeHitLabel(["Steam 09"]), "Eşleşen kod: Steam 09");
  assert.equal(codeHitLabel(["LA92-4", "LA92-45", "LA92-5"]), "Eşleşen kod: LA92-4 +2 kod");
  assert.equal(codeHitLabel([]), "");
});
