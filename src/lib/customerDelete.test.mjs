// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { confirmationMatches, deletionNotice } from "./customerDelete.ts";

const customer = { email: "toptan@test.com", full_name: "Ali Veli", company_title: "Test Toptan Ltd." };

test("the final button opens to SİL, the e-mail or the name — nothing else", () => {
  for (const typed of ["SİL", "sil", " Sil ", "SIL", "toptan@test.com", "TOPTAN@TEST.COM", "Ali Veli", "test toptan ltd."]) {
    assert.equal(confirmationMatches(typed, customer), true, typed);
  }
  for (const typed of ["", "   ", "SIL!", "toptan", "evet", "Ali"]) {
    assert.equal(confirmationMatches(typed, customer), false, typed);
  }
  // No name on file: an empty name must not match an empty answer.
  assert.equal(confirmationMatches("", { email: "a@b.c", full_name: null, company_title: null }), false);
});

test("the list says what was done", () => {
  assert.match(deletionNotice("deleted", "Test Toptan Ltd.", 0), /tüm kayıtlar kalıcı olarak silindi/);
  const kept = deletionNotice("anonymized", "Ali Veli", 3);
  assert.match(kept, /kişisel bilgileri kalıcı olarak silindi/);
  assert.match(kept, /3 siparişi/);
});
