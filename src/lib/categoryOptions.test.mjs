// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { narrowCategories } from "./categoryOptions.ts";
import { foldSearch } from "./searchFold.ts";

// The tree in the menu's order, as the picker flattens it.
const o = (id, name, ancestorIds = [], active = true) => ({ id, name, depth: ancestorIds.length, ancestorIds, active });
const OPTIONS = [
  o(1, "Nargile Takımları"),
  o(2, "Çantalı Nargile Takımları", [1]),
  o(3, "Nargile Lüleleri"),
  o(4, "Nargile Şişeleri"),
  o(5, "Nargile Malzemeleri"),
  o(6, "Sarf ve Tüketim Malzemeleri", [5]),
  o(7, "Folyolar", [5, 6]),
  o(8, "Bez Bantlar", [5, 6]),
  o(9, "Aksesuarlar", [5]),
  o(10, "Lüle Tıpaları", [5, 9]),
  o(11, "Yakıcılar", [5]),
  o(12, "Çakmaklar", [5, 11], false),
];
const lines = (q) => narrowCategories(OPTIONS, q, foldSearch).map((l) => `${l.option.name}:${l.kind}`);

test("nothing typed: every line, as a match", () => {
  const all = narrowCategories(OPTIONS, "   ", foldSearch);
  assert.equal(all.length, OPTIONS.length);
  assert.ok(all.every((l) => l.kind === "match" && l.mark === null));
});

test("a shelf comes with the groups above it, in the tree's order", () => {
  assert.deepEqual(lines("fol"), [
    "Nargile Malzemeleri:context",
    "Sarf ve Tüketim Malzemeleri:context",
    "Folyolar:match",
  ]);
});

test("Turkish letters fold both ways: \"lül\", \"lul\" and \"LÜL\" are one", () => {
  const expected = ["Nargile Lüleleri:match", "Nargile Malzemeleri:context", "Aksesuarlar:context", "Lüle Tıpaları:match"];
  assert.deepEqual(lines("lül"), expected);
  assert.deepEqual(lines("lul"), expected);
  assert.deepEqual(lines("LÜL"), expected);
  assert.deepEqual(lines("şişe"), ["Nargile Şişeleri:match"]);
  assert.deepEqual(lines("sise"), ["Nargile Şişeleri:match"]);
});

test("typing a group brings its shelves, marked as below it", () => {
  assert.deepEqual(lines("sarf"), [
    "Nargile Malzemeleri:context",
    "Sarf ve Tüketim Malzemeleri:match",
    "Folyolar:below",
    "Bez Bantlar:below",
  ]);
});

test("a name that matches is marked where the typed text is", () => {
  const [line] = narrowCategories(OPTIONS, "TIPA", foldSearch).filter((l) => l.kind === "match");
  assert.equal(line.option.name, "Lüle Tıpaları");
  assert.deepEqual(line.mark, [5, 9]);
  assert.equal(line.option.name.slice(...line.mark), "Tıpa");
  // A line shown only for its place has nothing to mark.
  assert.equal(narrowCategories(OPTIONS, "fol", foldSearch)[0].mark, null);
});

test("an inactive category is found like any other", () => {
  assert.deepEqual(lines("çakmak"), ["Nargile Malzemeleri:context", "Yakıcılar:context", "Çakmaklar:match"]);
});

test("nothing matches: no lines", () => {
  assert.deepEqual(lines("xyz"), []);
});
