// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { foldSearch, matchesSearch } from "./searchFold.ts";

test("Turkish letters fold to ASCII, lowercased", () => {
  assert.equal(foldSearch("LÜLE ÇEŞİTLERİ"), "lule cesitleri");
  assert.equal(foldSearch("Kömür"), "komur");
  assert.equal(foldSearch("NARGİLE ığdır Şişe Ağız"), "nargile igdir sise agiz");
});

test("a search typed without Turkish letters finds the words with them", () => {
  assert.ok(matchesSearch("lule", "Sırlı Lüle"));
  assert.ok(matchesSearch("komur", "Hindistan Cevizi KÖMÜR"));
  assert.ok(matchesSearch("Lüle", "lule seti"));
  assert.ok(!matchesSearch("marpuc", "Lüle"));
  assert.ok(matchesSearch("  ", "anything"));
});
