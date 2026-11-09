// `npm test` — a price's two boxes, as the price table and the ERP prices type them.
import assert from "node:assert/strict";
import { test } from "node:test";

import { splitVat } from "./erpCatalog.ts";
import { convertVat, parseDecimalInput, typedVatCell, vatCellAtRate } from "./format.ts";

const empty = { excl: "", incl: "" };
/** What the PDF prints for a group shown "KDV dahil": the saved KDV hariç price plus VAT. */
const printed = (excl, rate) => splitVat(Number(parseDecimalInput(excl)), rate, true).total;

test("a KDV dahil ERP price is saved KDV hariç and printed back as typed", () => {
  const cell = typedVatCell(empty, "incl", "310", 20);
  assert.deepEqual(cell, { excl: "258,33", incl: "310", basis: "incl" });
  assert.equal(parseDecimalInput(cell.excl), "258.33"); // what the server gets
  assert.equal(printed(cell.excl, 20), 310);
});

test("a new rate keeps the KDV dahil price typed and re-derives the saved one", () => {
  const cell = vatCellAtRate(typedVatCell(empty, "incl", "310", 20), 10);
  assert.deepEqual(cell, { excl: "281,82", incl: "310", basis: "incl" });
  assert.equal(printed(cell.excl, 10), 310);
  // Back again: still the 310 typed.
  assert.deepEqual(vatCellAtRate(cell, 20), { excl: "258,33", incl: "310", basis: "incl" });
});

test("a saved or KDV hariç typed price is kept at a new rate; its KDV dahil side follows", () => {
  const loaded = { excl: "258,33", incl: convertVat("258,33", 20) };
  assert.equal(loaded.incl, "310,00");
  assert.deepEqual(vatCellAtRate(loaded, 10), { excl: "258,33", incl: "284,16" });
  // Typed KDV hariç after KDV dahil: the net price is the one kept from then on.
  const retyped = typedVatCell(typedVatCell(empty, "incl", "310", 20), "excl", "300", 20);
  assert.deepEqual(retyped, { excl: "300", incl: "360,00" });
  assert.deepEqual(vatCellAtRate(retyped, 10), { excl: "300", incl: "330,00" });
});

test("half-typed keeps the other side; cleared clears both", () => {
  const cell = typedVatCell(empty, "incl", "310", 20);
  assert.equal(typedVatCell(cell, "incl", "31,", 20).excl, "25,83");
  assert.equal(typedVatCell(cell, "incl", "abc", 20).excl, "258,33");
  assert.deepEqual(typedVatCell(cell, "incl", "", 20), { excl: "", incl: "", basis: "incl" });
});

test("at 20% every whole-lira and even-kuruş KDV dahil price comes back exactly", () => {
  for (let kurus = 2; kurus <= 200000; kurus += 2) {
    const incl = `${Math.floor(kurus / 100)},${String(kurus % 100).padStart(2, "0")}`;
    const excl = convertVat(incl, 20, true);
    assert.equal(convertVat(excl, 20), incl, incl);
    assert.equal(Math.round(printed(excl, 20) * 100), kurus, incl);
  }
  // Some odd kuruş cannot: 310,05 / 1,20 = 258,375 → 258,38, and back 310,06 (the PDF's sum too).
  assert.equal(convertVat(convertVat("310,05", 20, true), 20), "310,06");
});
