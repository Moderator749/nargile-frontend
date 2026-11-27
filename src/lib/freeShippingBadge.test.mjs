// `npm test` — the "Kargo Bedava" badge: when it shows, where it sits, what it says.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { BADGE_CORNERS, FREE_SHIPPING_LABEL, freeShippingFrom, lineShipsFree, showsFreeShipping } from "./freeShippingBadge.ts";

const plain = {
  is_free_shipping: false,
  free_shipping_min_quantity: null,
  opp_is_free_shipping: false,
  opp_free_shipping_min_quantity: null,
};
const show = (product, extra = {}) => showsFreeShipping({ product, dealLive: false, perks: true, ...extra });

test("renders when the product's free-shipping switch is on", () => {
  assert.equal(show({ ...plain, is_free_shipping: true }), true);
});

test("hidden when the switch is off — whatever the price (a 3,000 TL+ set gets no badge)", () => {
  // The rule takes no price at all: carts over the threshold ship free anyway, without the badge.
  assert.equal(show(plain), false);
  assert.equal(showsFreeShipping.length, 1);
  assert.doesNotMatch(readFileSync(new URL("./freeShippingBadge.ts", import.meta.url), "utf8"), /free_shipping_threshold/);
});

test("a switch with a quantity condition above one unit promises nothing on the card", () => {
  assert.equal(show({ ...plain, is_free_shipping: true, free_shipping_min_quantity: 3 }), false);
  assert.equal(show({ ...plain, is_free_shipping: true, free_shipping_min_quantity: 1 }), true);
});

test("during a live deal the Fırsat block's own switch decides", () => {
  assert.equal(show({ ...plain, is_free_shipping: true }, { dealLive: true }), false);
  assert.equal(show({ ...plain, opp_is_free_shipping: true }, { dealLive: true }), true);
  assert.equal(show({ ...plain, opp_is_free_shipping: true }), false);
});

test("never for Kafe, Toptan or Bayi: a tier price does not include carriage", () => {
  assert.equal(show({ ...plain, is_free_shipping: true }, { perks: false }), false);
});

test("freeShippingFrom: the units the switch needs, or null when it is off", () => {
  assert.equal(freeShippingFrom(plain, false), null);
  assert.equal(freeShippingFrom({ ...plain, is_free_shipping: true }, false), 1);
  assert.equal(freeShippingFrom({ ...plain, is_free_shipping: true, free_shipping_min_quantity: 4 }, false), 4);
  assert.equal(freeShippingFrom({ ...plain, opp_is_free_shipping: true, opp_free_shipping_min_quantity: 2 }, true), 2);
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

test("lineShipsFree: a cart line meets its switch only from its quantity", () => {
  assert.equal(lineShipsFree({ quantity: 1, ships_free_from: 1 }), true);
  assert.equal(lineShipsFree({ quantity: 2, ships_free_from: 3 }), false);
  assert.equal(lineShipsFree({ quantity: 3, ships_free_from: 3 }), true);
  assert.equal(lineShipsFree({ quantity: 5, ships_free_from: null }), false);
  assert.equal(lineShipsFree({ quantity: 5 }), false); // a line saved before the field existed
});
