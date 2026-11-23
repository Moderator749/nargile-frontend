// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { brandCaps, capsInputValue } from "./brandCase.ts";

test("brand names go to neutral capitals: i is I, never İ", () => {
  assert.equal(brandCaps("Shisha Foil"), "SHISHA FOIL");
  assert.equal(brandCaps("telamon bowl"), "TELAMON BOWL");
  assert.equal(brandCaps("mr. wood"), "MR. WOOD");
  assert.equal(brandCaps("khalil mamoon"), "KHALIL MAMOON");
});

test("Turkish letters: typed capitals stay, small ones take their capital", () => {
  assert.equal(brandCaps("İSTANBUL"), "İSTANBUL");
  assert.equal(brandCaps("ĞÜŞÖÇİ"), "ĞÜŞÖÇİ");
  assert.equal(brandCaps("ğüşöç"), "ĞÜŞÖÇ");
  assert.equal(brandCaps("ılık"), "ILIK");
});

test("the text keeps its length (the caret's place)", () => {
  assert.equal(brandCaps("straße"), "STRAßE");
  for (const s of ["abc", "ılık", "straße", "Çiğ köfte 2"]) assert.equal(brandCaps(s).length, s.length);
  assert.equal(brandCaps(""), "");
  assert.equal(brandCaps("ALREADY CAPS 123"), "ALREADY CAPS 123");
});

test("an input keeps its caret and selection when re-cased", () => {
  const calls = [];
  const el = {
    value: "shisha foil",
    selectionStart: 3,
    selectionEnd: 5,
    selectionDirection: "forward",
    setSelectionRange(a, b, d) {
      calls.push([a, b, d]);
    },
  };
  assert.equal(capsInputValue(el), "SHISHA FOIL");
  assert.equal(el.value, "SHISHA FOIL");
  assert.deepEqual(calls, [[3, 5, "forward"]]);
});

test("an input already in capitals, or mid-composition, is not touched", () => {
  const el = { value: "SHISHA", selectionStart: 2, selectionEnd: 2, selectionDirection: "none", setSelectionRange: () => assert.fail() };
  assert.equal(capsInputValue(el), "SHISHA");
  const composing = { value: "sh", setSelectionRange: () => assert.fail() };
  assert.equal(capsInputValue(composing, true), "sh");
  assert.equal(composing.value, "sh");
});
