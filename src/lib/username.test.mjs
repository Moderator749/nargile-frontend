// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { USERNAME, cleanUsername, trimUsername } from "./username.ts";

test("a space becomes one underscore, and none at the start", () => {
  assert.deepEqual(cleanUsername("ali veli"), { value: "ali_veli", spaces: true, other: false });
  assert.deepEqual(cleanUsername("  ali   veli"), { value: "ali_veli", spaces: true, other: false });
  assert.equal(cleanUsername("ali\tveli").value, "ali_veli");
});

test("Turkish and accented letters become plain ones", () => {
  assert.deepEqual(cleanUsername("ayşe.gül"), { value: "ayse.gul", spaces: false, other: true });
  assert.equal(cleanUsername("IŞIKÇI ığdır").value, "ISIKCI_igdir");
  assert.equal(cleanUsername("İstanbul").value, "Istanbul");
  assert.equal(cleanUsername("José").value, "Jose");
});

test("anything else is left out, and said so", () => {
  assert.deepEqual(cleanUsername("ali@veli!"), { value: "aliveli", spaces: false, other: true });
  assert.deepEqual(cleanUsername("ali_veli-34.x"), { value: "ali_veli-34.x", spaces: false, other: false });
  assert.equal(cleanUsername("a".repeat(40)).value.length, 30);
});

test("leaving the field trims what a username cannot start or end with", () => {
  assert.equal(trimUsername("ali_veli_"), "ali_veli");
  assert.equal(trimUsername("._ali."), "ali");
  assert.ok(USERNAME.test(trimUsername(cleanUsername(" ali veli ").value)));
});
