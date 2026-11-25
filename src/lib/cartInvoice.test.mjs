// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { invoiceView, isCorporateAccount } from "./cartInvoice.ts";

const view = (over) => invoiceView({ perksEligible: true, corporate: false, quoteOnly: false, hasVat: true, ...over });

test("a firm's cart reads as an invoice, a Kurumsal one on Perakende too", () => {
  assert.equal(view({ perksEligible: false }), true); // Kafe, Toptan, Bayi
  assert.equal(view({ perksEligible: true, corporate: true }), true); // Kurumsal on Perakende: discounts, invoice view
  assert.equal(view({ perksEligible: true, corporate: false }), false); // Bireysel: VAT included
  assert.equal(view({ perksEligible: false, quoteOnly: true }), false); // an export request
  assert.equal(view({ corporate: true, hasVat: false }), false); // nothing to show yet
});

test("Kurumsal is any domestic account that is not Bireysel", () => {
  for (const type of ["CAFE", "TOBACCO_SHOP", "COMPANY", "SOLE_PROPRIETOR"]) assert.equal(isCorporateAccount(type), true, type);
  for (const type of ["INDIVIDUAL", "INTERNATIONAL", null, undefined]) assert.equal(isCorporateAccount(type), false, String(type));
});
