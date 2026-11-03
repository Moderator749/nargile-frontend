// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { badgeText, clockTime, dayLabel, mergeMessages, titleWithCount, turkeyDay } from "./teamChannel.ts";

const msg = (id, body = `m${id}`) => ({
  id, body, sender_id: "u", sender_name: "Ali", created_at: "2026-11-03T09:00:00Z", mine: false, can_delete: false,
});

test("a poll's answer folds in once per id, oldest first, the withdrawn gone", () => {
  const merged = mergeMessages([msg(3), msg(1)], [msg(2), msg(3, "edited copy"), msg(5)], [1]);
  assert.deepEqual(merged.map((m) => m.id), [2, 3, 5]);
  assert.equal(merged.find((m) => m.id === 3).body, "edited copy");
  assert.deepEqual(mergeMessages([], [], [9]), []);
});

test("days are Turkey's, headed Bugün and Dün", () => {
  const now = new Date("2026-11-03T10:00:00Z");
  assert.equal(dayLabel("2026-11-03T05:00:00Z", now), "Bugün");
  // 22:30 UTC on 2 November is already the 3rd in İstanbul.
  assert.equal(dayLabel("2026-11-02T22:30:00Z", now), "Bugün");
  assert.equal(dayLabel("2026-11-02T08:00:00Z", now), "Dün");
  assert.equal(dayLabel("2026-11-01T08:00:00Z", now), "1 Kasım 2026");
  assert.equal(turkeyDay("2026-11-02T21:00:00Z"), "2026-11-03");
  assert.equal(clockTime("2026-11-03T06:05:00Z"), "09:05");
});

test("the tab's title carries the unread count, and loses it at zero", () => {
  assert.equal(titleWithCount("Siparişler · Yönetim", 3), "(3) Siparişler · Yönetim");
  assert.equal(titleWithCount("(3) Siparişler · Yönetim", 5), "(5) Siparişler · Yönetim");
  assert.equal(titleWithCount("(99+) Raporlar", 0), "Raporlar");
  assert.equal(titleWithCount("Raporlar", 150), "(99+) Raporlar");
  assert.equal(badgeText(7), "7");
  assert.equal(badgeText(100), "99+");
});
