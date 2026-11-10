// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { CURSOR_MAX_AGE, SEEN_MAX, alertText, lira, remember, startCursor, unseen } from "./orderAlerts.ts";

const order = (id, extra = {}) => ({
  id,
  order_number: `ORD-20261110-${id}`,
  total_amount: "1234.5",
  customer_name: "Ayşe Yılmaz",
  placed_at: "2026-11-10T09:00:00Z",
  ...extra,
});

test("a recent cursor is kept; an old, missing or broken one is not", () => {
  const now = Date.parse("2026-11-10T09:00:00Z");
  assert.equal(startCursor("2026-11-10T08:58:00Z", now), "2026-11-10T08:58:00Z");
  assert.equal(startCursor(new Date(now - CURSOR_MAX_AGE - 1).toISOString(), now), null);
  assert.equal(startCursor(null, now), null);
  assert.equal(startCursor("yesterday", now), null);
});

test("only orders not yet seen are news, each once", () => {
  const got = unseen([order("A"), order("B"), order("A")], new Set(["B"]));
  assert.deepEqual(got.map((o) => o.id), ["A"]);
});

test("the seen list keeps the newest ids, no repeats", () => {
  assert.deepEqual(remember(["A", "B"], ["B", "C"]), ["A", "B", "C"]);
  const many = Array.from({ length: SEEN_MAX }, (_, i) => String(i));
  const kept = remember(many, ["new"]);
  assert.equal(kept.length, SEEN_MAX);
  assert.equal(kept.at(-1), "new");
  assert.equal(kept[0], "1");
});

test("the toast reads as the shop writes prices", () => {
  assert.equal(lira("1234.5"), "1.234,50 TL");
  assert.equal(lira("25000.00"), "25.000,00 TL");
  assert.equal(alertText(order("X")), "Yeni Sipariş! #ORD-20261110-X - 1.234,50 TL - Ayşe Yılmaz");
});
