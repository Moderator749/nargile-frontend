// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { catalogPrice, erpPriceFor, productCatalogPreview, rowCatalogPrice } from "./erpCatalog.ts";

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

const PRODUCT = {
  erp_price_usd: null,
  erp_price_eur: null,
  erp_price_tl: null,
  erp_display_bayi: null,
  erp_display_toptan: true,
  erp_display_kafe: null,
  erp_display_perakende: null,
  vat_rate: "20.00",
  prices_excl: { TRY: { DEALER: "148.00", WHOLESALE: "160.00", RETAIL: "200.00" } },
};
const ROW = { currency: "TRY", rowVatRate: 18 };

test("the PDF falls back to the product's price table, KDV hariç, at its rate", () => {
  // The worksheet's after-VAT retail (999) is not used: the product has a retail price.
  const retail = rowCatalogPrice({ ...ROW, product: PRODUCT, segment: "RETAIL", rowPrice: 999, rowPriceBeforeVat: false });
  assert.deepEqual([retail.excl, retail.vat, retail.total, retail.fromErp], [200, 40, 240, false]);
  const toptan = rowCatalogPrice({ ...ROW, product: PRODUCT, segment: "WHOLESALE", rowPrice: 500, rowPriceBeforeVat: true });
  assert.deepEqual([toptan.excl, toptan.total, toptan.display], [160, 192, true]);
});

test("an ERP price comes before the product's price table", () => {
  const product = { ...PRODUCT, erp_price_tl: "1100.00" };
  const bayi = rowCatalogPrice({ ...ROW, product, segment: "DEALER", rowPrice: 500, rowPriceBeforeVat: true });
  assert.deepEqual([bayi.excl, bayi.fromErp], [1100, true]);
});

test("the row's own price only where the product has none, or there is no product", () => {
  const kafe = rowCatalogPrice({ ...ROW, product: PRODUCT, segment: "CAFE", rowPrice: 500, rowPriceBeforeVat: true });
  assert.deepEqual([kafe.excl, kafe.total], [500, 590]); // the row's 18 %
  const usd = rowCatalogPrice({ ...ROW, currency: "USD", product: PRODUCT, segment: "DEALER", rowPrice: 10, rowPriceBeforeVat: true });
  assert.equal(usd.excl, 10);
  const none = rowCatalogPrice({ ...ROW, product: null, segment: "RETAIL", rowPrice: 1180, rowPriceBeforeVat: false });
  assert.deepEqual([none.excl, none.total], [1000, 1180]);
  assert.equal(rowCatalogPrice({ ...ROW, product: null, segment: "CAFE", rowPrice: null, rowPriceBeforeVat: true }), null);
});
