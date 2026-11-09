// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { catalogPrice, erpPriceFor, productCatalogPreview, rowCatalogPrice } from "./erpCatalog.ts";

const NONE = { DEALER: null, WHOLESALE: null, CAFE: null, RETAIL: null };
const TABLE = { DEALER: 800, WHOLESALE: 900, CAFE: null, RETAIL: 1000 };

// MLZ 154: the worksheet's blue ERP row (105, 105, 125; retail 180 on the shelf = 150 before VAT)
// against the green row the site got (110.52, 110.52, 131.58).
const MLZ_ERP = { TRY: { DEALER: "105.00", WHOLESALE: "105.00", CAFE: "125.00", RETAIL: "150.00" } };
const MLZ_TABLE = { DEALER: 110.52, WHOLESALE: 110.52, CAFE: 131.58, RETAIL: 150 };

test("MLZ 154: each group's base is its own ERP price, not the marked-up table", () => {
  const preview = productCatalogPreview({
    erpPrices: MLZ_ERP,
    display: { DEALER: false, WHOLESALE: true, CAFE: true, RETAIL: null },
    currency: "TRY",
    vatRate: 20,
    priceExcl: MLZ_TABLE,
  });
  assert.deepEqual(
    Object.values(preview).map((p) => [p.excl, p.fromErp]),
    [[105, true], [105, true], [125, true], [150, true]],
  );
  // VAT is added only where "KDV dahil göster" is picked: 105 → 126, 125 → 150.
  assert.equal(preview.DEALER.display, false);
  assert.equal(preview.WHOLESALE.total, 126);
  assert.equal(preview.CAFE.total, 150);
  assert.deepEqual([preview.RETAIL.excl, preview.RETAIL.vat, preview.RETAIL.total], [150, 30, 180]);
});

test("without an ERP price the base is the price table's KDV hariç price", () => {
  const preview = productCatalogPreview({ erpPrices: {}, display: NONE, currency: "TRY", vatRate: 20, priceExcl: TABLE });
  assert.deepEqual(
    [preview.DEALER.excl, preview.WHOLESALE.excl, preview.RETAIL.excl],
    [800, 900, 1000], // retail too: its before-VAT price, never the 1.200 after it
  );
  assert.equal(preview.RETAIL.fromErp, false);
  assert.equal(preview.CAFE, null); // no price: off the catalogue
});

test("the product's own VAT rate is the one added", () => {
  const preview = productCatalogPreview({
    erpPrices: { USD: { RETAIL: "24.50" } },
    display: { ...NONE, RETAIL: true },
    currency: "USD",
    vatRate: 10,
    priceExcl: TABLE,
  });
  assert.equal(preview.RETAIL.total, 26.95);
  assert.equal(preview.RETAIL.currency, "USD");
});

test("a group's ERP price in the catalogue's currency, else its first of TL, USD, EUR", () => {
  const prices = { USD: { DEALER: "24.50" }, TRY: { DEALER: "1100", CAFE: "900" }, EUR: { CAFE: "21" } };
  assert.deepEqual(erpPriceFor(prices, "USD", "DEALER"), { amount: 24.5, currency: "USD" });
  assert.deepEqual(erpPriceFor(prices, "USD", "CAFE"), { amount: 900, currency: "TRY" });
  assert.equal(erpPriceFor(prices, "EUR", "RETAIL"), null);
  assert.equal(erpPriceFor(null, "TRY", "DEALER"), null);
});

test("a worksheet price after VAT (the PDF's fallback for retail) is split back to its base", () => {
  const p = catalogPrice({ ownPrice: 1200, ownPriceBeforeVat: false, currency: "TRY", vatRate: 20, erp: null, display: false });
  assert.deepEqual([p.excl, p.vat, p.total], [1000, 200, 1200]);
});

const PRODUCT = {
  erp_prices: {},
  erp_display_bayi: null,
  erp_display_toptan: true,
  erp_display_kafe: null,
  erp_display_perakende: null,
  vat_rate: "20.00",
  prices_excl: { TRY: { DEALER: "148.00", WHOLESALE: "160.00", RETAIL: "200.00" } },
};
const ROW = { currency: "TRY", rowVatRate: 18, rowErp: null, rowErpBeforeVat: true };

test("the PDF falls back to the product's price table, KDV hariç, at its rate", () => {
  // The worksheet's after-VAT retail (999) is not used: the product has a retail price.
  const retail = rowCatalogPrice({ ...ROW, product: PRODUCT, segment: "RETAIL", rowPrice: 999, rowPriceBeforeVat: false });
  assert.deepEqual([retail.excl, retail.vat, retail.total, retail.fromErp], [200, 40, 240, false]);
  const toptan = rowCatalogPrice({ ...ROW, product: PRODUCT, segment: "WHOLESALE", rowPrice: 500, rowPriceBeforeVat: true });
  assert.deepEqual([toptan.excl, toptan.total, toptan.display], [160, 192, true]);
});

test("an ERP price comes before the product's price table", () => {
  const product = { ...PRODUCT, erp_prices: { TRY: { DEALER: "1100.00" } } };
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

test("MLZ 154 in the PDF: the product's ERP prices, never the green row", () => {
  const product = { ...PRODUCT, erp_display_bayi: false, erp_display_kafe: true, erp_prices: MLZ_ERP,
    prices_excl: { TRY: { DEALER: "110.52", WHOLESALE: "110.52", CAFE: "131.58", RETAIL: "150.00" } } };
  const row = { ...ROW, rowVatRate: 20, product };
  const bayi = rowCatalogPrice({ ...row, segment: "DEALER", rowErp: 105, rowPrice: 110.52, rowPriceBeforeVat: true });
  assert.deepEqual([bayi.excl, bayi.total, bayi.display], [105, 126, false]);
  const kafe = rowCatalogPrice({ ...row, segment: "CAFE", rowErp: 125, rowPrice: 131.58, rowPriceBeforeVat: true });
  assert.deepEqual([kafe.excl, kafe.total, kafe.display], [125, 150, true]);
});

test("a row not applied yet: its own blue ERP row comes before the product's price table", () => {
  const product = { ...PRODUCT, vat_rate: "20.00", prices_excl: { TRY: { DEALER: "110.52", RETAIL: "150.00" } } };
  const row = { ...ROW, rowVatRate: 20, product };
  const bayi = rowCatalogPrice({ ...row, segment: "DEALER", rowErp: 105, rowPrice: 110.52, rowPriceBeforeVat: true });
  assert.deepEqual([bayi.excl, bayi.fromErp], [105, true]);
  // Retail's ERP fiyatı is a shelf price: 180 after VAT is 150 before it.
  const retail = rowCatalogPrice({ ...row, segment: "RETAIL", rowErp: 180, rowErpBeforeVat: false, rowPrice: 180, rowPriceBeforeVat: false });
  assert.deepEqual([retail.excl, retail.total], [150, 180]);
  // No product at all: the row's blue row still wins over its green one.
  const alone = rowCatalogPrice({ ...row, product: null, segment: "CAFE", rowErp: 125, rowPrice: 131.58, rowPriceBeforeVat: true });
  assert.equal(alone.excl, 125);
});
