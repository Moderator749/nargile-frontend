// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { stepOnArrowKey, stepSize, steppedValue } from "./numberStep.ts";

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

const keydown = (key, value, mods = {}) => {
  const event = { key, shiftKey: false, altKey: false, defaultPrevented: false, currentTarget: { value, readOnly: false, disabled: false }, ...mods };
  event.preventDefault = () => (event.defaultPrevented = true);
  return event;
};

test("the field's keydown: ↑/↓ hand the stepped text to its own onChange path", () => {
  const got = [];
  const up = keydown("ArrowUp", "12,5");
  stepOnArrowKey(up, (v) => got.push(v));
  assert.deepEqual(got, ["13,5"]);
  assert.equal(up.defaultPrevented, true); // no caret jump to the start
});

test("←/→ and other keys are left to the field: the caret moves", () => {
  const got = [];
  for (const key of ["ArrowLeft", "ArrowRight", "Home", "a"]) {
    const event = keydown(key, "12,5");
    stepOnArrowKey(event, (v) => got.push(v));
    assert.equal(event.defaultPrevented, false);
  }
  assert.deepEqual(got, []);
});

test("whole numbers stay whole; a points adjustment may go negative; a key already used is not", () => {
  const got = [];
  stepOnArrowKey(keydown("ArrowUp", "4", { altKey: true }), (v) => got.push(v), { integer: true });
  stepOnArrowKey(keydown("ArrowDown", "0"), (v) => got.push(v), { negative: true });
  stepOnArrowKey(keydown("ArrowUp", "4", { defaultPrevented: true }), (v) => got.push(v));
  stepOnArrowKey(keydown("ArrowUp", "4", { currentTarget: { value: "4", readOnly: true, disabled: false } }), (v) => got.push(v));
  assert.deepEqual(got, ["5", "-1"]);
});

