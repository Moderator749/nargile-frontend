// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { stepSize, steppedValue } from "./numberStep.ts";

test("whole numbers step by one, keeping their form", () => {
  assert.equal(steppedValue("12", 1), "13");
  assert.equal(steppedValue("12", -1), "11");
  assert.equal(steppedValue("", 1), "1");
});

test("a decimal comma stays a comma, with its decimals", () => {
  assert.equal(steppedValue("12,5", 1), "13,5");
  assert.equal(steppedValue("12,50", -1), "11,50");
  assert.equal(steppedValue("1.234,5", 10), "1244,5"); // thousands dots dropped
});

test("a decimal point stays a point; a tenth step adds a decimal", () => {
  assert.equal(steppedValue("12.5", 1), "13.5");
  assert.equal(steppedValue("12", 0.1), "12.1");
  assert.equal(steppedValue("0,3", -0.1), "0,2");
});

test("never below zero from zero or above; not a number stays", () => {
  assert.equal(steppedValue("0", -1), "0");
  assert.equal(steppedValue("0,5", -1), "0,0");
  assert.equal(steppedValue("-2", 1), "-1");
  assert.equal(steppedValue("abc", 1), null);
  assert.equal(steppedValue("%5", 1), null);
});

test("the step: 1, ×10 with Shift, 0.1 with Alt; other keys none", () => {
  assert.equal(stepSize("ArrowUp", false, false), 1);
  assert.equal(stepSize("ArrowDown", true, false), -10);
  assert.equal(stepSize("ArrowUp", false, true), 0.1);
  assert.equal(stepSize("ArrowLeft", false, false), null);
});
