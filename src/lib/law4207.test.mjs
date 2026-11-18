// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { law4207Terms } from "./law4207.ts";

test("Turkish: tobacco forms and pleasure words are reported once each", () => {
  const html = "<p>Nargile <strong>keyfinizi</strong> artırır; tütünün yanmasını önler. Tütünün kokusu kalmaz.</p>";
  assert.deepEqual(law4207Terms([html]), ["tütünün", "keyfinizi"]);
});

test("Turkish: İ/I casing and multi-field input", () => {
  assert.deepEqual(law4207Terms(["BOL DUMANLI", "Kendi ZEVKİNİZE göre"]), ["zevkinize", "bol dumanlı"]);
});

test("technical words and the herbal composition line are not reported", () => {
  assert.deepEqual(law4207Terms(["<p>Rahat içim, 13 mm iç boru. Tütün ve nikotin içermez.</p>"]), []);
  assert.deepEqual(law4207Terms(["Contains no tobacco or nicotine. Smooth draw."], "en"), []);
});

test("English and Arabic patterns", () => {
  assert.deepEqual(law4207Terms(["Enjoy dense smoke with your tobacco."], "en"), ["tobacco", "enjoy", "dense smoke"]);
  assert.deepEqual(law4207Terms(["يحافظ على نكهة المعسل ويمنحك متعة"], "ar"), ["معسل", "متعة"]);
  assert.deepEqual(law4207Terms(["خيارات متعددة"], "ar"), []);
});

test("empty input", () => {
  assert.deepEqual(law4207Terms([null, undefined, ""]), []);
});
