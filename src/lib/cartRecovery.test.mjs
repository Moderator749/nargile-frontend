// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { placedWhen, recoveryAmounts, recoveryMessage } from "./cartRecovery.ts";
import { formatMoney } from "./format.ts";

test("five percent off, to the kuruş", () => {
  assert.deepEqual(recoveryAmounts(1551.52), { before: 1551.52, after: 1473.94, discount: 77.58 });
  assert.deepEqual(recoveryAmounts(1000), { before: 1000, after: 950, discount: 50 });
  // 0,30 TL × 5% = 1,5 kuruş: half up.
  assert.deepEqual(recoveryAmounts(0.3), { before: 0.3, after: 0.28, discount: 0.02 });
  // A float that is not quite its decimal (0.1 + 0.2) still lands on the kuruş.
  assert.equal(recoveryAmounts(0.1 + 0.2).after, 0.28);
});

test("the amounts read as the shop writes them", () => {
  const { before, after } = recoveryAmounts(1551.52);
  assert.equal(formatMoney(before), "1.551,52 TL");
  assert.equal(formatMoney(after), "1.473,94 TL");
});

test("the message names the customer and both totals, the new one bold", () => {
  const text = recoveryMessage("Ahmet Yılmaz", "Gece", "1.551,52 TL", "1.473,94 TL");
  assert.ok(text.startsWith("Merhaba Ahmet Yılmaz, Nargile Malzemesi'nden ulaşıyorum.\n\nGece oluşturduğunuz"));
  assert.ok(text.includes("sepet tutarınız 1.551,52 TL yerine *1.473,94 TL*'ye düşmüş olur."));
  assert.ok(text.endsWith("bugün kargoya vermiş oluruz. 🚀"));
  assert.equal(text.split("\n\n").length, 4);
});

test("no name: a plain greeting", () => {
  assert.ok(recoveryMessage("  ", "Gece", "1 TL", "0,95 TL").startsWith("Merhaba, Nargile"));
  assert.ok(recoveryMessage(null, "Gece", "1 TL", "0,95 TL").startsWith("Merhaba, Nargile"));
});

test("the link's text survives encoding, emoji and line breaks included", () => {
  const text = recoveryMessage("Ayşe", "Akşam", "1.551,52 TL", "1.473,94 TL");
  const href = `https://wa.me/905321112233?text=${encodeURIComponent(text)}`;
  // Nothing raw in the query: no spaces, line breaks or emoji.
  assert.ok(!/[\s🤝🚀]/u.test(href));
  assert.equal(new URL(href).searchParams.get("text"), text);
});

// İstanbul is UTC+3 all year: 06:00 there is 03:00Z.
const NOW = new Date("2026-11-06T17:00:00Z"); // 20:00 in İstanbul

test("placed today: the part of the day, on İstanbul's clock", () => {
  assert.equal(placedWhen("2026-11-05T21:00:00Z", NOW), "Gece"); // 00:00
  assert.equal(placedWhen("2026-11-06T02:59:00Z", NOW), "Gece"); // 05:59
  assert.equal(placedWhen("2026-11-06T03:00:00Z", NOW), "Sabah"); // 06:00
  assert.equal(placedWhen("2026-11-06T08:59:00Z", NOW), "Sabah"); // 11:59
  assert.equal(placedWhen("2026-11-06T09:00:00Z", NOW), "Bugün"); // 12:00
  assert.equal(placedWhen("2026-11-06T14:59:00Z", NOW), "Bugün"); // 17:59
  assert.equal(placedWhen("2026-11-06T15:00:00Z", NOW), "Akşam"); // 18:00
});

test("placed yesterday: the same, after \"Dün\"; before that, its date", () => {
  assert.equal(placedWhen("2026-11-05T20:59:00Z", NOW), "Dün akşam"); // 23:59 on the 5th
  assert.equal(placedWhen("2026-11-04T22:30:00Z", NOW), "Dün gece"); // 01:30 on the 5th
  assert.equal(placedWhen("2026-11-05T10:00:00Z", NOW), "Dün öğleden sonra");
  assert.equal(placedWhen("2026-11-03T10:00:00Z", NOW), "3 Kasım tarihinde");
});

test("UTC's midnight is not İstanbul's", () => {
  // 22:30Z on the 5th is 01:30 on the 6th in İstanbul: tonight, not yesterday.
  assert.equal(placedWhen("2026-11-05T22:30:00Z", new Date("2026-11-06T06:00:00Z")), "Gece");
});

test("the message opens its second paragraph with when", () => {
  const text = recoveryMessage("Ali", "Dün akşam", "1 TL", "0,95 TL");
  assert.ok(text.includes("\n\nDün akşam oluşturduğunuz siparişte banka limit/onay"));
});
