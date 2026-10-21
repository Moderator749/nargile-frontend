// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { convertVat, formatMoney, formatMoneyCompact, parseDecimalInput, tidyPriceInput } from "./format.ts";

test("a comma and a dot are both the decimal mark", () => {
  for (const [raw, want] of [
    ["183,33", "183.33"], ["183.33", "183.33"], ["500,75", "500.75"], ["400,50", "400.50"], ["400.5", "400.50"],
    ["1.250,50", "1250.50"], ["1,250.50", "1250.50"], [",5", "0.50"], [".5", "0.50"], ["₺ 1 250,50", "1250.50"],
  ])
    assert.equal(parseDecimalInput(raw), want, raw);
});

test("Turkish thousands groups stay thousands", () => {
  assert.equal(parseDecimalInput("1.250"), "1250.00");
  assert.equal(parseDecimalInput("12.500.000"), "12500000.00");
});

test("a decimal still being typed counts, so the other box keeps up", () => {
  assert.equal(parseDecimalInput("400,"), "400.00");
  assert.equal(parseDecimalInput("400."), "400.00");
  assert.equal(convertVat("400,", 20), "480,00");
});

test("what is not a price is refused", () => {
  for (const raw of ["", " ", "abc", "183,333", "1e3", "-5", "12.5.0", ",", "."])
    assert.equal(parseDecimalInput(raw), null, raw);
});

test("VAT both ways, in whole kuruş", () => {
  assert.equal(convertVat("400", 20), "480,00");
  assert.equal(convertVat("183,33", 20), "220,00");
  assert.equal(convertVat("183.33", 20), "220,00");
  assert.equal(convertVat("500,75", 10), "550,83");
  assert.equal(convertVat("100", 20, true), "83,33");
  assert.equal(convertVat("220,00", 20, true), "183,33");
  assert.equal(convertVat("500,75", 1, true), "495,79");
  assert.equal(convertVat("99999999,99", 20), "119999999,99");
  assert.equal(convertVat("0,05", 10), "0,06"); // 0.055 rounds half up, not down by a float
  assert.equal(convertVat("1,005", 20), ""); // three decimals: not a price
});

test("leaving a box tidies it", () => {
  assert.equal(tidyPriceInput("183.33"), "183,33");
  assert.equal(tidyPriceInput("400,"), "400,00");
  assert.equal(tidyPriceInput("1.250"), "1250,00");
  assert.equal(tidyPriceInput("183,333"), "183,333");
});

test("lira is written after the amount, as TL", () => {
  assert.equal(formatMoney("6700"), "6.700,00 TL");
  assert.equal(formatMoney(1234567.5), "1.234.567,50 TL");
  assert.equal(formatMoneyCompact("20000.00"), "20.000 TL");
  assert.equal(formatMoneyCompact("199.90"), "199,90 TL");
  // Another currency keeps its sign.
  assert.match(formatMoney("24.41", "USD"), /^\$24,41$/);
  // A price pasted back in with its TL still reads.
  assert.equal(parseDecimalInput("6.700,00 TL"), "6700.00");
});
