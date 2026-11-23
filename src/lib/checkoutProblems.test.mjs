// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { PROBLEM_TARGETS, errorsByField, firstPresent, validationEventParams } from "./checkoutProblems.ts";

const problems = [
  { field: "phone", message: "Geçerli bir telefon numarası girin." },
  { field: "city", message: "İl seçin." },
  { field: "terms", message: "Şartlar ve Kurallar Sözleşmesi'ni onaylayın." },
];

test("every field the cart can name has somewhere on the page to go", () => {
  for (const [field, ids] of Object.entries(PROBLEM_TARGETS)) {
    assert.ok(ids.length > 0, field);
  }
  assert.equal(PROBLEM_TARGETS.name[0], "addr-name");
  assert.equal(PROBLEM_TARGETS.distanceSales[0], "agreement-distanceSales");
});

test("each field gets its own message, the first one when named twice", () => {
  const errors = errorsByField([...problems, { field: "city", message: "later" }]);
  assert.deepEqual(errors, {
    phone: "Geçerli bir telefon numarası girin.",
    city: "İl seçin.",
    terms: "Şartlar ve Kurallar Sözleşmesi'ni onaylayın.",
  });
});

test("the GA4 event names the fields only, never what was typed", () => {
  const params = validationEventParams(problems);
  assert.deepEqual(params, { error_count: 3, first_field: "phone", fields: "phone,city,terms" });
  assert.ok(!JSON.stringify(params).includes("telefon"));
  // GA keeps a parameter to 100 characters.
  const many = Object.keys(PROBLEM_TARGETS).map((field) => ({ field, message: "x" }));
  assert.ok(validationEventParams(many).fields.length <= 100);
});

test("the first target that is on the page wins; the section when the field is closed", () => {
  const onPage = new Set(["delivery-heading"]);
  const byId = (id) => (onPage.has(id) ? {} : null);
  assert.equal(firstPresent(PROBLEM_TARGETS.receiverName, byId), "delivery-heading");
  onPage.add("branch-receiver-name");
  assert.equal(firstPresent(PROBLEM_TARGETS.receiverName, byId), "branch-receiver-name");
  assert.equal(firstPresent(["nowhere"], byId), null);
});
