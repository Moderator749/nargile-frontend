// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { computeSheet, decimalText, parseAmount, round2, sheetProblem, wholeLira } from "./pricingMath.ts";

const typed = (percent, extra = {}) => ({ percent, desired: null, erpPrice: null, ...extra });
const sheet = (over = {}) =>
  computeSheet({
    cost: 1000,
    columns: [typed(15), typed(15)],
    extras: [],
    retail: { ...typed(20), vatRate: 20 },
    appliedPercent: null,
    vatMode: "EXCL",
    currency: "TRY",
    usdRate: null,
    eurRate: null,
    ...over,
  });

// ── Rounding, as the server does it ──────────────────────────────────────────

test("half a kuruş rounds up, float noise or not", () => {
  assert.equal(round2(10.605), 10.61); // 10.605 × 100 is 1060.4999999999998 in floats
  assert.equal(round2(10.1 * 1.05), 10.61);
  assert.equal(round2(12.9 * 1.45), 18.71); // 18.705
  assert.equal(round2(16.125), 16.13);
  assert.equal(round2(1904.4), 1904.4);
});

test("whole lira rounds up and leaves a whole amount alone", () => {
  assert.equal(wholeLira(1904.4), 1905);
  assert.equal(wholeLira(1164), 1164);
  assert.equal(wholeLira(1164.0000000001), 1164); // float noise is not a kuruş
  assert.equal(wholeLira(0.01), 1);
});

// ── Cetvel 1: KDV hariç maliyet ──────────────────────────────────────────────

test("Cetvel 1 chains the classes, adds VAT at retail, and shows the whole-lira shelf price", () => {
  const out = sheet();
  assert.deepEqual(out.columns.map((c) => c.computed), [1150, 1322.5]);
  assert.equal(out.retailBeforeVat, 1587);
  assert.equal(out.retail.computed, 1904.4);
  assert.equal(out.retail.price, 1904.4);
  assert.equal(out.retailShelf, 1905); // what the site gets
});

test("a class's price takes the ERP fiyatı plus the applied rate, but the chain runs on calculated values", () => {
  const out = sheet({ columns: [typed(15, { erpPrice: 1200 }), typed(15)], appliedPercent: 5 });
  assert.equal(out.columns[0].auto, 1260); // 1200 + 5%
  assert.equal(out.columns[1].computed, 1322.5); // 1150 × 1.15, not 1200 × 1.15
  assert.equal(out.columns[1].auto, 1388.63); // 1322.50 + 5% = 1388.625, half up
});

test("a typed price wins and never feeds the chain", () => {
  const out = sheet({ columns: [typed(15, { desired: 999 }), typed(15)] });
  assert.equal(out.columns[0].price, 999);
  assert.equal(out.columns[1].computed, 1322.5);
});

test("a half kuruş in the chain rounds up on the class, as the server saves it", () => {
  const out = sheet({ cost: 10.1, columns: [typed(5)] });
  assert.equal(out.columns[0].price, 10.61);
});

test("Mağaza Fiyatı sits before retail; retail builds on its step before VAT", () => {
  const out = sheet({ extras: [typed(10)] });
  assert.equal(out.extras[0].beforeVat, 1454.75); // 1322.50 + 10%
  assert.equal(out.retail.computed, round2(1454.75 * 1.2 * 1.2));
  // Without its percent it is passed over: retail builds on the last class.
  assert.equal(sheet({ extras: [typed(null)] }).retail.computed, 1904.4);
});

test("a retail price typed with kuruş still goes to the site in whole lira", () => {
  const out = sheet({ retail: { ...typed(20, { desired: 199.9 }), vatRate: 20 } });
  assert.equal(out.retail.price, 199.9);
  assert.equal(out.retailShelf, 200);
});

test("VAT 0 adds nothing and divides nothing", () => {
  const out = sheet({ retail: { ...typed(20), vatRate: 0 } });
  assert.equal(out.retail.computed, 1587);
});

// ── Cetvel 2: KDV dahil maliyet ──────────────────────────────────────────────

test("Cetvel 2 adds no VAT at retail and takes the ERP fiyatı as typed (115 + 5% = 120.75)", () => {
  const out = sheet({
    vatMode: "INCL",
    cost: 100,
    columns: [typed(15, { erpPrice: 115 })],
    appliedPercent: 5,
    retail: { ...typed(20), vatRate: 20 },
  });
  assert.equal(out.columns[0].auto, 120.75);
  assert.equal(out.retail.computed, 138); // 100 × 1.15 × 1.20, no VAT on top
  assert.equal(out.retailShelf, 138);
});

// ── USD / EUR sheets ─────────────────────────────────────────────────────────

test("a foreign sheet's TL price is retail × rate in whole lira; its retail has no TL shelf", () => {
  const out = sheet({ currency: "USD", cost: 10, columns: [], retail: { ...typed(0, { desired: 10.37 }), vatRate: 20 }, usdRate: 41.2345 });
  assert.equal(out.tryPrice, 428); // 427.60 at the kuruş
  assert.equal(out.retailShelf, null);
  assert.equal(sheet({ currency: "EUR", eurRate: null }).tryPrice, null);
});

// ── Reading what was typed ───────────────────────────────────────────────────

test("numbers as a Turkish admin types them", () => {
  assert.equal(parseAmount("1.250,50"), 1250.5);
  assert.equal(parseAmount("12.500"), 12500);
  assert.equal(parseAmount("49,3681"), 49.3681);
  assert.equal(parseAmount("-5"), -5);
  assert.equal(parseAmount("12a"), null);
  assert.equal(parseAmount(""), null);
  assert.equal(decimalText("0,375"), "0.375"); // an ERP price keeps four places
  assert.equal(decimalText("12,345", 2), "12.35");
});

// ── What can be saved ────────────────────────────────────────────────────────

const draft = (over = {}) => ({
  currency: "TRY",
  cost: "1000",
  columns: [
    { label: "Bayi", segment: "DEALER", percent: "15", desired: "", erpPrice: "" },
    { label: "Toptan", segment: "WHOLESALE", percent: "15", desired: "", erpPrice: "" },
  ],
  extras: [{ label: "Mağaza Fiyatı", percent: "", desired: "", erpPrice: "" }],
  retailPercent: "20",
  vatRate: "20",
  retailDesired: "",
  retailErpPrice: "",
  appliedPercent: "",
  usdRate: "",
  eurRate: "",
  finalTry: "",
  ...over,
});
const withColumn = (patch) => draft({ columns: [{ ...draft().columns[0], ...patch }, draft().columns[1]] });

test("a complete sheet can be saved", () => {
  assert.equal(sheetProblem(draft()), null);
  assert.equal(sheetProblem(draft({ vatRate: "20.00" })), null); // as a saved row loads it
});

test("an unreadable figure is refused, never dropped", () => {
  assert.match(sheetProblem(withColumn({ desired: "12a" })), /Yeşil satır/);
  assert.match(sheetProblem(draft({ retailDesired: "abc" })), /Yeşil satır/);
  assert.match(sheetProblem(draft({ currency: "USD", usdRate: "41,5", finalTry: "12a" })), /Son karar/);
  assert.match(sheetProblem(draft({ currency: "USD", usdRate: "41,x" })), /Dolar kuru/);
  assert.match(sheetProblem(draft({ currency: "USD", usdRate: "41,5", eurRate: "abc" })), /kuru/);
  assert.match(sheetProblem(withColumn({ erpPrice: "12,3,4" })), /ERP/);
  assert.match(sheetProblem(draft({ appliedPercent: "beş" })), /Uygulanacak oran/);
});

test("prices must be above zero and to the kuruş", () => {
  assert.match(sheetProblem(withColumn({ desired: "0" })), /Yeşil satır/);
  assert.match(sheetProblem(withColumn({ desired: "12,345" })), /Yeşil satır/);
  assert.equal(sheetProblem(withColumn({ desired: "12.345" })), null); // 12.345 is twelve thousand
  assert.match(sheetProblem(draft({ cost: "0" })), /Maliyet/);
  assert.match(sheetProblem(draft({ currency: "USD", usdRate: "41,5", finalTry: "0" })), /Son karar/);
  assert.equal(sheetProblem(withColumn({ erpPrice: "0,375" })), null); // ERP: four places allowed
});

test("percents must stay above -100", () => {
  assert.match(sheetProblem(withColumn({ percent: "-100" })), /-100/);
  assert.match(sheetProblem(draft({ retailPercent: "-150" })), /-100/);
  assert.match(sheetProblem(draft({ appliedPercent: "-100" })), /Uygulanacak oran/);
  assert.equal(sheetProblem(withColumn({ percent: "-99,99" })), null);
});

test("only the shop's VAT rates", () => {
  for (const rate of ["0", "1", "10", "20"]) assert.equal(sheetProblem(draft({ vatRate: rate })), null);
  for (const rate of ["15", "18", "", "x"]) assert.match(sheetProblem(draft({ vatRate: rate })), /KDV/);
});

test("a foreign sheet needs its rate; an extra with only an ERP price is not silently dropped", () => {
  assert.match(sheetProblem(draft({ currency: "EUR" })), /Euro kuru/);
  assert.equal(sheetProblem(draft({ currency: "EUR", eurRate: "48,1" })), null);
  assert.match(sheetProblem(draft({ extras: [{ label: "Mağaza", percent: "", desired: "", erpPrice: "250" }] })), /Mağaza/);
});
