// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { inLira, pickPriceRow } from "./retailPrice.ts";

const RETAIL = 1;
const DEALER = 2;
const row = (segment_id, currency, price_incl_tax) => ({ segment_id, currency, price_incl_tax });

test("a dollar price is the retail price when there is no lira one", () => {
  const prices = [row(DEALER, "TRY", "900.00"), row(RETAIL, "USD", "120.00")];
  assert.deepEqual(pickPriceRow(prices, RETAIL), row(RETAIL, "USD", "120.00"));
});

test("lira first, then dollars, then euros, as the storefront picks", () => {
  const all = [row(RETAIL, "EUR", "100.00"), row(RETAIL, "USD", "110.00"), row(RETAIL, "TRY", "4000.00")];
  assert.equal(pickPriceRow(all, RETAIL).currency, "TRY");
  assert.equal(pickPriceRow(all.slice(0, 2), RETAIL).currency, "USD");
  assert.equal(pickPriceRow(all.slice(0, 1), RETAIL).currency, "EUR");
});

test("no row for the segment, or no segment known: none", () => {
  assert.equal(pickPriceRow([row(DEALER, "USD", "10.00")], RETAIL), null);
  assert.equal(pickPriceRow([row(RETAIL, "USD", "10.00")], undefined), null);
});

test("a foreign price in lira at the day's rate; none for lira or an unknown rate", () => {
  const rates = { USD: "35.1287", EUR: "38.0042" };
  assert.equal(inLira(row(RETAIL, "USD", "120.00"), rates), 4215.44);
  assert.equal(inLira(row(RETAIL, "EUR", "10.00"), rates), 380.04);
  assert.equal(inLira(row(RETAIL, "TRY", "4000.00"), rates), null);
  assert.equal(inLira(row(RETAIL, "USD", "120.00"), null), null);
  assert.equal(inLira(row(RETAIL, "USD", "120.00"), { USD: "0" }), null);
});
