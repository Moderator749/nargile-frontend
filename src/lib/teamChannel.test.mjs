// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CLOSED_EVERY,
  IDLE_AFTER,
  IDLE_EVERY,
  OPEN_EVERY,
  badgeText,
  clockTime,
  dayLabel,
  mergeMessages,
  pollEvery,
  titleWithCount,
  turkeyDay,
  untilIdle,
} from "./teamChannel.ts";

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

test("the drawer asks every 5 s open, every 30 s open but unattended, every minute shut", () => {
  assert.equal(OPEN_EVERY, 5_000);
  assert.equal(IDLE_EVERY, 30_000);
  assert.equal(CLOSED_EVERY, 60_000);
  assert.equal(pollEvery(true, false), OPEN_EVERY);
  assert.equal(pollEvery(true, true), IDLE_EVERY);
  // Shut, being away changes nothing: the badge is already asked rarely.
  assert.equal(pollEvery(false, false), CLOSED_EVERY);
  assert.equal(pollEvery(false, true), CLOSED_EVERY);
});

test("ten minutes without a sign of life counts as away", () => {
  assert.equal(IDLE_AFTER, 600_000);
  const last = 1_000_000;
  assert.equal(untilIdle(last, last), IDLE_AFTER);
  assert.equal(untilIdle(last, last + 60_000), 540_000);
  assert.equal(untilIdle(last, last + IDLE_AFTER), 0);
  assert.equal(untilIdle(last, last + IDLE_AFTER + 5_000), 0);
});
