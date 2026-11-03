// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  apiParams,
  defaultFilters,
  filtersFromParams,
  filtersToParams,
  periodProblem,
  rangeDates,
  turkeyToday,
} from "./reportFilters.ts";

const TODAY = "2026-11-05"; // a Thursday

test("the quick ranges run up to today, the week from Monday", () => {
  assert.deepEqual(rangeDates("today", TODAY), { from: "2026-11-05", to: "2026-11-05" });
  assert.deepEqual(rangeDates("week", TODAY), { from: "2026-11-02", to: "2026-11-05" });
  assert.deepEqual(rangeDates("week", "2026-11-02"), { from: "2026-11-02", to: "2026-11-02" });
  assert.deepEqual(rangeDates("week", "2026-11-08"), { from: "2026-11-02", to: "2026-11-08" }); // Sunday
  assert.deepEqual(rangeDates("month", TODAY), { from: "2026-11-01", to: "2026-11-05" });
});

test("today is Turkey's day, not the browser's", () => {
  // 22:30 UTC on 2 November is already 3 November in İstanbul (UTC+3).
  assert.equal(turkeyToday(new Date("2026-11-02T22:30:00Z")), "2026-11-03");
  assert.equal(turkeyToday(new Date("2026-11-02T20:30:00Z")), "2026-11-02");
});

test("this month with nothing else leaves the address bare", () => {
  assert.equal(filtersToParams(defaultFilters(TODAY)).toString(), "");
  assert.deepEqual(filtersFromParams(new URLSearchParams(), TODAY), defaultFilters(TODAY));
});

test("filters survive the address both ways", () => {
  const f = {
    range: "custom", from: "2026-09-01", to: "2026-10-15",
    segment: "DEALER", paymentMethod: "BANK_TRANSFER", categoryId: 12, brandId: 4,
  };
  const params = filtersToParams(f);
  assert.equal(params.toString(), "aralik=ozel&baslangic=2026-09-01&bitis=2026-10-15&grup=DEALER&odeme=BANK_TRANSFER&kategori=12&marka=4");
  assert.deepEqual(filtersFromParams(params, TODAY), f);
});

test("a quick range is worked out again on the day it is opened", () => {
  const f = filtersFromParams(new URLSearchParams("aralik=hafta&baslangic=2020-01-01&bitis=2020-01-02"), TODAY);
  assert.deepEqual([f.range, f.from, f.to], ["week", "2026-11-02", "2026-11-05"]);
});

test("anything unreadable reads as no filter", () => {
  const f = filtersFromParams(
    new URLSearchParams("aralik=yil&grup=VIP&odeme=QUOTE&kategori=-3&marka=abc"), TODAY,
  );
  assert.deepEqual(f, defaultFilters(TODAY));
  for (const bad of ["baslangic=2026-02-30&bitis=2026-03-01", "baslangic=2026-10-10&bitis=2026-10-01", "baslangic=2020-01-01&bitis=2026-01-01"]) {
    const g = filtersFromParams(new URLSearchParams(`aralik=ozel&${bad}`), TODAY);
    assert.deepEqual([g.range, g.from, g.to], ["month", "2026-11-01", "2026-11-05"], bad);
  }
});

test("a custom period says what is wrong with it", () => {
  assert.equal(periodProblem("2026-10-01", "2026-10-31"), null);
  assert.match(periodProblem("2026-10-31", "2026-10-01"), /sonra olamaz/);
  assert.match(periodProblem("2024-01-01", "2026-01-02"), /iki yıllık/);
  assert.match(periodProblem("", "2026-10-01"), /seçin/);
});

test("the API is asked with its own names, and only for what is set", () => {
  assert.deepEqual(apiParams(defaultFilters(TODAY)), { from: "2026-11-01", to: "2026-11-05" });
  assert.deepEqual(
    apiParams({ ...defaultFilters(TODAY), segment: "CAFE", paymentMethod: "CREDIT_CARD", categoryId: 3, brandId: 9 }),
    { from: "2026-11-01", to: "2026-11-05", segment: "CAFE", payment_method: "CREDIT_CARD", category_id: 3, brand_id: 9 },
  );
});
