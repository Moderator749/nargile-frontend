// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { RENAMED_BLOG_QUESTIONS, currentBlogAnchor } from "./blogAnchors.ts";

const FILES = ["./blogQuestions.ts", "./content/blogQuestions.en.ts", "./content/blogQuestions.ar.ts"].map((f) =>
  readFileSync(new URL(f, import.meta.url), "utf8"),
);

test("an old question anchor lands on its renamed id", () => {
  assert.equal(
    currentBlogAnchor("#sss-mukemmel-bir-nargile-keyfi-icin-nelere-dikkat-edilmeli"),
    "sss-dogru-nargile-kullanimi-icin-nelere-dikkat-edilmeli",
  );
  assert.equal(currentBlogAnchor("#sss-nargile-lulesi-nedir-cesitleri-var-midir"), "sss-nargile-lulesi-nedir-cesitleri-var-midir");
  assert.equal(currentBlogAnchor("#baska-bir-yer"), "baska-bir-yer");
});

test("every renamed id exists in all three languages and the old ids are gone", () => {
  for (const [oldId, newId] of Object.entries(RENAMED_BLOG_QUESTIONS)) {
    for (const file of FILES) {
      assert.ok(file.includes(`"id": "${newId}"`), `${newId} missing`);
      assert.ok(!file.includes(`"id": "${oldId}"`), `${oldId} still present`);
    }
  }
});

test("no question id carries pleasure wording", () => {
  for (const file of FILES) {
    for (const [, id] of file.matchAll(/"id": "([^"]+)"/g)) assert.doesNotMatch(id, /keyf|keyif|zevk/);
  }
});
