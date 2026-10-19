// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { PATTERNS, encode128, symbols128 } from "./code128.ts";

test("every symbol is 11 modules (the stop 13), three bars and three spaces, and none repeats", () => {
  assert.equal(PATTERNS.length, 107);
  PATTERNS.forEach((p, i) => {
    const widths = [...p].map(Number);
    assert.equal(widths.reduce((a, b) => a + b, 0), i === 106 ? 13 : 11, `symbol ${i}`);
    assert.equal(widths.length, i === 106 ? 7 : 6, `symbol ${i}`);
  });
  assert.equal(new Set(PATTERNS).size, 107);
});

test("text is set B with its check symbol: the textbook 'Wikipedia'", () => {
  // Start B, W i k i p e d i a, check: (104 + Σ value × position) mod 103 = 3281 mod 103.
  assert.deepEqual(symbols128("Wikipedia"), [104, 55, 73, 75, 73, 80, 69, 68, 73, 65, 88]);
});

test("runs of four digits or more go two to a symbol in set C", () => {
  // Start C, 20 26 10 19 08 50 34, then B for "9E23B8".
  const key = symbols128("202610190850349E23B8");
  assert.deepEqual(key.slice(0, 9), [105, 20, 26, 10, 19, 8, 50, 34, 100]);
  assert.deepEqual(key.slice(9, -1), [25, 37, 18, 19, 34, 24]);
  // An odd run leaves its last digit to B; a short one stays in B.
  assert.deepEqual(symbols128("12345A").slice(0, 5), [105, 12, 34, 100, 21]);
  assert.deepEqual(symbols128("A12B").slice(0, 4), [104, 33, 17, 18]);
});

test("a key fits a 100 mm label", () => {
  const modules = encode128("202610190850349E23B8B").reduce((a, b) => a + b, 0);
  assert.ok(modules <= 200, `${modules} modules`); // 0.4 mm a module → 80 mm
});

test("what Code 128 B cannot carry is refused", () => {
  assert.throws(() => symbols128("Ç"), RangeError);
  assert.throws(() => symbols128(""), RangeError);
});
