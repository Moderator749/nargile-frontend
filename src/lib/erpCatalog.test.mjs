// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { catalogPrice, erpPriceFor, productCatalogPreview } from "./erpCatalog.ts";

const NONE = { DEALER: null, WHOLESALE: null, CAFE: null, RETAIL: null };
const TABLE = { DEALER: 800, WHOLESALE: 900, CAFE: null, RETAIL: 1000 };

test("the base is the ERP price as typed, before VAT, for every group", () => {
  const preview = productCatalogPreview({
    erp: { erp_price_tl: "1100.00" },
    display: { DEALER: false, WHOLESALE: true, CAFE: null, RETAIL: true },
    currency: "TRY",
    vatRate: 20,
    priceExcl: TABLE,
  });
  for (const p of Object.values(preview)) {
    assert.equal(p.excl, 1100);
    assert.equal(p.fromErp, true);
  }
  // VAT is added only where "KDV dahil göster" is picked.
  assert.equal(preview.DEALER.display, false);
  assert.equal(preview.WHOLESALE.total, 1320);
  assert.equal(preview.RETAIL.total, 1320);
  assert.deepEqual([preview.CAFE.excl, preview.CAFE.vat, preview.CAFE.total], [1100, 220, 1320]);
});

test("without an ERP price the base is the price table's KDV hariç price", () => {
  const preview = productCatalogPreview({ erp: {}, display: NONE, currency: "TRY", vatRate: 20, priceExcl: TABLE });
  assert.deepEqual(
    [preview.DEALER.excl, preview.WHOLESALE.excl, preview.RETAIL.excl],
    [800, 900, 1000], // retail too: its before-VAT price, never the 1.200 after it
  );
  assert.equal(preview.RETAIL.fromErp, false);
  assert.equal(preview.CAFE, null); // no price: off the catalogue
});

test("the product's own VAT rate is the one added", () => {
  const preview = productCatalogPreview({
    erp: { erp_price_usd: "24.50" },
    display: { ...NONE, RETAIL: true },
    currency: "USD",
    vatRate: 10,
    priceExcl: TABLE,
  });
  assert.equal(preview.RETAIL.total, 26.95);
  assert.equal(preview.RETAIL.currency, "USD");
});

test("an ERP price in the catalogue's currency, else the first typed of TL, USD, EUR", () => {
  assert.deepEqual(erpPriceFor({ erp_price_usd: "24.50", erp_price_tl: "1100" }, "USD"), { amount: 24.5, currency: "USD" });
  assert.deepEqual(erpPriceFor({ erp_price_usd: "24.50", erp_price_eur: "21" }, "TRY"), { amount: 24.5, currency: "USD" });
  assert.equal(erpPriceFor({ erp_price_usd: null }, "EUR"), null);
});

test("a worksheet price after VAT (the PDF's fallback for retail) is split back to its base", () => {
  const p = catalogPrice({ ownPrice: 1200, ownPriceBeforeVat: false, currency: "TRY", vatRate: 20, erp: null, display: false });
  assert.deepEqual([p.excl, p.vat, p.total], [1000, 200, 1200]);
});
