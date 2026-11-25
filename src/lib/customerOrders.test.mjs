// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { PAYMENT_METHOD_LABELS, linesSummary, rangeProblem } from "./customerOrders.ts";

const line = (product_name, variant, quantity) => ({ product_name, variant, quantity });

test("an order's lines read as one line, the rest counted", () => {
  assert.equal(linesSummary([line("Lüle", "Siyah", 2), line("Kömür", null, 1)]), "Lüle (Siyah) ×2, Kömür ×1");
  assert.equal(
    linesSummary([line("A", null, 1), line("B", null, 1), line("C", null, 1), line("D", null, 1), line("E", null, 5)]),
    "A ×1, B ×1, C ×1 +2 ürün",
  );
  assert.equal(linesSummary([]), "");
});

test("a date range may be open at either end but not backwards", () => {
  assert.equal(rangeProblem("", ""), null);
  assert.equal(rangeProblem("2026-11-01", ""), null);
  assert.equal(rangeProblem("2026-11-01", "2026-11-01"), null);
  assert.match(rangeProblem("2026-11-02", "2026-11-01"), /önce/);
});

test("payment methods in the panel's words", () => {
  assert.equal(PAYMENT_METHOD_LABELS.CREDIT_CARD, "Kredi Kartı");
  assert.equal(PAYMENT_METHOD_LABELS.BANK_TRANSFER, "Havale/EFT");
});
