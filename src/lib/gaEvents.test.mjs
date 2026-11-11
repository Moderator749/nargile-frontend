// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { mock, test } from "node:test";

// What the browser gives the module: a page, and the Google tag's gtag.
const sent = [];
globalThis.window = { gtag: (...args) => sent.push(args) };
globalThis.location = { pathname: "/nargile-luleleri" };
mock.timers.enable({ apis: ["setTimeout"] });

const { trackListImpression, trackSelectItem } = await import("./gaEvents.ts");

const list = { id: "category_nargile-luleleri", name: "Kategori: nargile-luleleri" };
const other = { id: "home_kumbara", name: "Ana sayfa: Kumbara" };
const item = (id) => ({ item_id: id, item_name: `Ürün ${id}`, price: 100 });
const events = (name) => sent.filter(([, event]) => event === name).map(([, , params]) => params);

test("cards seen together go out as one view_item_list per list, each card once", () => {
  trackListImpression(list, item("LL1"), 0);
  trackListImpression(list, item("LL2"), 1);
  trackListImpression(other, item("KB1"), 0);
  trackListImpression(list, item("LL1"), 0); // scrolled past again
  assert.equal(events("view_item_list").length, 0); // waits a moment for the rest of the screenful
  mock.timers.tick(1000);
  const views = events("view_item_list");
  assert.equal(views.length, 2);
  const lules = views.find((v) => v.item_list_id === list.id);
  assert.deepEqual(lules.items.map((i) => [i.item_id, i.index, i.item_list_name]), [
    ["LL1", 0, list.name],
    ["LL2", 1, list.name],
  ]);
});

test("a click sends what was still waiting first, then select_item with its place", () => {
  trackListImpression(list, item("LL3"), 2);
  trackSelectItem(list, item("LL3"), 2);
  const tail = sent.slice(-2).map(([, event]) => event);
  assert.deepEqual(tail, ["view_item_list", "select_item"]);
  const [click] = events("select_item");
  assert.equal(click.item_list_id, list.id);
  assert.deepEqual([click.items[0].item_id, click.items[0].index], ["LL3", 2]);
});
