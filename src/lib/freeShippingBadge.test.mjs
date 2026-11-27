// `npm test` — the "Kargo Bedava" badge: when it shows, where it sits, what it says.
import assert from "node:assert/strict";
import { test } from "node:test";

import { readFileSync } from "node:fs";

import { BADGE_CORNERS, FREE_SHIPPING_LABEL, showsFreeShipping } from "./freeShippingBadge.ts";

const plain = {
  is_free_shipping: false,
  free_shipping_min_quantity: null,
  opp_is_free_shipping: false,
  opp_free_shipping_min_quantity: null,
  is_cart_rule_applied: false,
};
const show = (product, priceInclTax, extra = {}) =>
  showsFreeShipping({ product, priceInclTax, dealLive: false, threshold: "3000.00", perks: true, ...extra });

test("renders when the product's free-shipping switch is on", () => {
  assert.equal(show({ ...plain, is_free_shipping: true }, "250.00"), true);
});

test("hidden when the switch is off and the price is under the threshold", () => {
  assert.equal(show(plain, "250.00"), false);
});

test("a price at or over the threshold ships free on its own, so it shows", () => {
  assert.equal(show(plain, "3000.00"), true);
  assert.equal(show(plain, "2999.99"), false);
});

test("coal over the threshold is not promised: its cart needs the minimum weight", () => {
  assert.equal(show({ ...plain, is_cart_rule_applied: true }, "5000.00"), false);
  // An older API without the field reads as coal.
  const older = { ...plain };
  delete older.is_cart_rule_applied;
  assert.equal(show(older, "5000.00"), false);
});

test("a switch with a quantity condition above one unit promises nothing on the card", () => {
  assert.equal(show({ ...plain, is_free_shipping: true, free_shipping_min_quantity: 3 }, "250.00"), false);
  assert.equal(show({ ...plain, is_free_shipping: true, free_shipping_min_quantity: 1 }, "250.00"), true);
});

test("during a live deal the Fırsat block's own switch decides", () => {
  assert.equal(show({ ...plain, is_free_shipping: true }, "250.00", { dealLive: true }), false);
  assert.equal(show({ ...plain, opp_is_free_shipping: true }, "250.00", { dealLive: true }), true);
  assert.equal(show({ ...plain, opp_is_free_shipping: true }, "250.00"), false);
});

test("never for Kafe, Toptan or Bayi: a tier price does not include carriage", () => {
  assert.equal(show({ ...plain, is_free_shipping: true }, "9000.00", { perks: false }), false);
});

test("no price yet, no threshold badge", () => {
  assert.equal(show(plain, null), false);
});

test("never in SultanPuan's corner: the two take opposite logical corners", () => {
  assert.equal(BADGE_CORNERS.sultanPuan, "start");
  assert.equal(BADGE_CORNERS.freeShipping, "end");
  assert.notEqual(BADGE_CORNERS.sultanPuan, BADGE_CORNERS.freeShipping);
});

test("localized text: TR, EN, AR", () => {
  assert.deepEqual(FREE_SHIPPING_LABEL, { tr: "Kargo Bedava", en: "Free Shipping", ar: "شحن مجاني" });
  // …and the card's messages use exactly these, one per language.
  const catalog = readFileSync(new URL("./i18n/messages/catalog.ts", import.meta.url), "utf8");
  for (const locale of ["tr", "en", "ar"]) assert.match(catalog, new RegExp(`freeShipping: FREE_SHIPPING_LABEL\\.${locale},`));
});
