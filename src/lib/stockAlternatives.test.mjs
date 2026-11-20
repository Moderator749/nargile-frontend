// `npm test` — "Stokta Benzer Alternatifler" under a shelf that is in effect sold out.
import assert from "node:assert/strict";
import { test } from "node:test";

import { needsAlternatives, pickAlternatives } from "./stockAlternatives.ts";

const product = (id, name, inStock = true) => ({ id, name, variants: [{ id: `${id}-v`, in_stock: inStock }] });

const mrWood = [
  product("a", "Mr.Wood Classic Artemis Kristal Şişe (Marpuç Dahil)", false),
  product("b", "Mr.Wood Classic Artemis Siyah Şişe (Marpuç Dahil)", false),
  product("c", "Mr.Wood Nargile Takımı - Classic Adonis Kristal Şişe", false),
  product("d", "Mr.Wood Nargile Takımı - Classic Adonis Siyah Şişe", false),
  product("e", "Mr.Wood Siyah Kesme Nargile Şişesi"),
];

test("a shelf with one spare bottle beside four sold-out sets is in effect sold out", () => {
  assert.equal(needsAlternatives(mrWood), true);
});

test("an ordinary shelf, small or big, is left alone", () => {
  assert.equal(needsAlternatives([product("x", "A"), product("y", "B")]), false);
  assert.equal(needsAlternatives([product("x", "A", false), product("y", "B"), product("z", "C")]), false);
  assert.equal(needsAlternatives([...Array(10)].map((_, i) => product(`p${i}`, "P", i < 6))), false);
  // A big shelf down to its last two qualifies too.
  assert.equal(needsAlternatives([...Array(10)].map((_, i) => product(`p${i}`, "P", i < 2))), true);
  assert.equal(needsAlternatives([]), false);
  assert.equal(needsAlternatives(null), false);
});

test("in-stock alternatives: telling words first, nothing on the page, sold out or twice", () => {
  const klasik = [
    product("k1", "Döküm Nargile Takımı - Kahveci"),
    product("k2", "Döküm Nargile Takımı - Wood Model"),
    product("k3", "Döküm Nargile Takımı - Hürrem", false),
  ];
  const parent = [product("k2", "Döküm Nargile Takımı - Wood Model"), product("e", "Mr.Wood Siyah Kesme Nargile Şişesi"),
    product("r1", "Union Fibonacci Exotic Wood Nargile Takımı"), product("r2", "Steamulation Pro X")];
  const picked = pickAlternatives(mrWood, [klasik, parent]).map((p) => p.id);
  assert.deepEqual(picked, ["k2", "r1", "k1", "r2"]);
});

test("one card per name", () => {
  const twins = [product("w1", "Döküm Nargile Takımı - Wood Model"), product("w2", "Döküm Nargile Takımı - Wood Model "), product("k", "Kahveci")];
  assert.deepEqual(pickAlternatives(mrWood, [twins]).map((p) => p.id), ["w1", "k"]);
});

test("at most the count asked for", () => {
  const pool = [...Array(20)].map((_, i) => product(`p${i}`, `Takım ${i}`));
  assert.equal(pickAlternatives(mrWood, [pool]).length, 8);
  assert.equal(pickAlternatives(mrWood, [pool], 4).length, 4);
});
