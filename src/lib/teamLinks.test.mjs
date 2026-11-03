// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { messageParts, orderHref, productHref, productToken } from "./teamLinks.ts";

const ID = "2bd1e56e-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
const kinds = (body) => messageParts(body).map((p) => (p.kind === "text" ? p.text : `<${p.kind}:${p.ref ?? p.id}|${p.text}>`)).join("");

test("an order is found by its whole number or its last six characters", () => {
  assert.equal(kinds("ORD-20261103084112-A1B2C3 hazır"), "<order:ORD-20261103084112-A1B2C3|ORD-20261103084112-A1B2C3> hazır");
  assert.equal(kinds("#a1b2c3 kargoda, #FFEE00 de"), "<order:A1B2C3|#a1b2c3> kargoda, <order:FFEE00|#FFEE00> de");
  assert.equal(kinds("(#A1B2C3)."), "(<order:A1B2C3|#A1B2C3>).");
});

test("look-alikes are left as text", () => {
  for (const body of ["XORD-20261103084112-A1B2C3", "ORD-20261103084112-A1B2C3D", "#A1B2C3D", "##A1B2C3", "&#123456;", "a#A1B2C3", "#A1B2CZ", "ORD-2026-A1B2C3"])
    assert.deepEqual(messageParts(body), [{ kind: "text", text: body }], body);
});

test("a product token links by id, whatever its code holds", () => {
  const token = productToken({ id: ID, base_code: "STEAM 13-1", name: "Pure [Nargile]\nTakımı" });
  assert.equal(token, `[STEAM 13-1 · Pure Nargile Takımı](ürün:${ID})`);
  const parts = messageParts(`Bak: ${token} ve #A1B2C3`);
  assert.deepEqual(parts, [
    { kind: "text", text: "Bak: " },
    { kind: "product", text: "STEAM 13-1 · Pure Nargile Takımı", id: ID },
    { kind: "text", text: " ve " },
    { kind: "order", text: "#A1B2C3", ref: "A1B2C3" },
  ]);
  // A malformed id is not a link.
  assert.equal(messageParts("[x](ürün:not-an-id)").length, 1);
});

test("plain text stays one part, untouched", () => {
  assert.deepEqual(messageParts('<b>kalın</b> & "tırnak"'), [{ kind: "text", text: '<b>kalın</b> & "tırnak"' }]);
  assert.deepEqual(messageParts(""), []);
});

test("links open the order in Siparişler and the product's page", () => {
  assert.equal(orderHref("A1B2C3"), "/admin/orders?siparis=A1B2C3");
  assert.equal(productHref(ID), `/admin/products/${ID}`);
});
