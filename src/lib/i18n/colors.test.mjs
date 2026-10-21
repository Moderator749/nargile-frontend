// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { colorLabel } from "./colors.ts";

test("Turkish is shown as typed", () => {
  assert.equal(colorLabel("Gold gövde-Beyaz şişe", "tr"), "Gold gövde-Beyaz şişe");
});

test("English: colours and parts, in order", () => {
  assert.equal(colorLabel("Siyah", "en"), "Black");
  assert.equal(colorLabel("SİYAH", "en"), "BLACK");
  assert.equal(colorLabel("Gold gövde-Beyaz şişe", "en"), "Gold body - White base");
  assert.equal(colorLabel("Çelik gövde siyah şişe", "en"), "Steel body - Black base");
  assert.equal(colorLabel("Gold Siyah", "en"), "Gold Black");
  assert.equal(colorLabel("Ateş çemberi", "en"), "Ring of Fire");
});

test("Arabic: the noun first, the colour agreeing with it", () => {
  assert.equal(colorLabel("Kırmızı", "ar"), "أحمر");
  assert.equal(colorLabel("Gold gövde-Beyaz şişe", "ar"), "جسم ذهبي - قاعدة بيضاء");
  assert.equal(colorLabel("Bronz gövde-Şeffaf şişe", "ar"), "جسم برونزي - قاعدة شفافة");
  assert.equal(colorLabel("Kalipso", "ar"), "Kalipso");
});
