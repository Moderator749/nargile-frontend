// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { collectTexts, translateTexts } from "./homeTranslations.ts";

const doc = {
  deals: { title: "Fırsatları Kaçırma", subtitle: " Stoklarla sınırlı. " },
  navigation: { top: [{ label: "LÜLELER", slug: "luleler", href: "/catalog/luleler", search: "lüle" }] },
  slides: [{ title: "Fırsatları Kaçırma", text_align: "left", image_url: "https://x/y.png", cta_href: "/catalog" }],
  footer: { phone: "0850 308 90 65", email: "a@b.co", copyright: "© 2026 Nargile Malzemesi" },
};

test("collects the words on the page, once each, and nothing else", () => {
  assert.deepEqual([...collectTexts(doc)], ["Fırsatları Kaçırma", "Stoklarla sınırlı.", "LÜLELER", "© 2026 Nargile Malzemesi"]);
});

test("swaps what the memory knows, leaves addresses, slugs and the rest alone", () => {
  const out = translateTexts(doc, { "Fırsatları Kaçırma": "Don't Miss the Deals", "Stoklarla sınırlı.": "While stocks last.", luleler: "x" });
  assert.equal(out.deals.title, "Don't Miss the Deals");
  assert.equal(out.deals.subtitle, "While stocks last.");
  assert.equal(out.slides[0].title, "Don't Miss the Deals");
  assert.equal(out.navigation.top[0].slug, "luleler");
  assert.equal(out.navigation.top[0].label, "LÜLELER");
  assert.equal(out.slides[0].text_align, "left");
  assert.equal(doc.deals.title, "Fırsatları Kaçırma"); // the input is not changed
});
