// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { dragged, orderOf, orderRequest, toBottom, toTop, withPositions } from "./productOrder.ts";

/** "AB|cde|FG": A and B ranked, c d e unranked, F and G kept at the bottom. */
function order(spec) {
  const [top, middle, bottom] = spec.split("|");
  const rows = [
    ...[...top].map((id, i) => ({ product_id: id, position: i, bottom: false })),
    ...[...middle].map((id) => ({ product_id: id, position: null, bottom: false })),
    ...[...bottom].map((id, i) => ({ product_id: id, position: i, bottom: true })),
  ];
  return orderOf(rows);
}
/** An order back as "AB|cde|FG". */
function spec({ rows, top, bottom }) {
  const ids = rows.map((r) => r.product_id).join("");
  return `${ids.slice(0, top)}|${ids.slice(top, ids.length - bottom)}|${ids.slice(ids.length - bottom)}`;
}
const ids = (...xs) => new Set(xs);
const move = (o, id, to) => {
  const rest = o.rows.filter((r) => r.product_id !== id);
  rest.splice(to, 0, o.rows.find((r) => r.product_id === id));
  return dragged(o, rest, id);
};

test("the server's rows make the three parts, and a save sends the top and the bottom", () => {
  const o = order("AB|cde|FG");
  assert.deepEqual([o.top, o.bottom], [2, 2]);
  assert.deepEqual(orderRequest(o), { productIds: ["A", "B"], bottomIds: ["F", "G"] });
  assert.deepEqual(
    withPositions(o).map((r) => [r.product_id, r.position, r.bottom]),
    [["A", 0, false], ["B", 1, false], ["c", null, false], ["d", null, false], ["e", null, false], ["F", 0, true], ["G", 1, true]],
  );
});

test("to the top: the picked lead, in their order, from whichever part", () => {
  assert.equal(spec(toTop(order("AB|cde|FG"), ids("d"))), "dAB|ce|FG");
  assert.equal(spec(toTop(order("AB|cde|FG"), ids("G", "c", "B"))), "BcGA|de|F");
  assert.equal(spec(toTop(order("|cde|"), ids("e", "c"))), "ce|d|");
  assert.equal(spec(toTop(order("AB|cde|FG"), ids())), "AB|cde|FG");
});

test("to the bottom: the picked close the page, in their order, after the bottom's own", () => {
  assert.equal(spec(toBottom(order("AB|cde|FG"), ids("A"))), "B|cde|FGA");
  assert.equal(spec(toBottom(order("AB|cde|FG"), ids("F", "d", "A"))), "B|ce|GAdF");
  assert.equal(spec(toBottom(order("|cde|"), ids("c"))), "|de|c");
});

test("a drag ranks everything above where it lands, as before", () => {
  assert.equal(spec(move(order("AB|cde|"), "e", 0)), "eAB|cd|");
  assert.equal(spec(move(order("AB|cde|"), "A", 3)), "BcdA|e|");
  assert.equal(spec(move(order("|cde|"), "e", 1)), "ce|d|");
});

test("a drag into the bottom joins it; out of it, it is ranked", () => {
  // Dropped among the bottom, or just above it.
  assert.equal(spec(move(order("AB|cde|FG"), "c", 6)), "AB|de|FGc");
  assert.equal(spec(move(order("AB|cde|FG"), "c", 4)), "AB|de|cFG");
  assert.equal(spec(move(order("AB|cde|FG"), "A", 4)), "B|cde|AFG");
  // Taken up out of it.
  assert.equal(spec(move(order("AB|cde|FG"), "G", 1)), "AGB|cde|F");
  assert.equal(spec(move(order("AB|cde|FG"), "F", 3)), "ABcF|de|G");
  // Within the bottom, its order changes.
  assert.equal(spec(move(order("AB|cde|FG"), "G", 5)), "AB|cde|GF");
});
