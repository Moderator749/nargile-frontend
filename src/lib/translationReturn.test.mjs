// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { approvalsHref, cameFromApprovals, productApprovalHref, requestedTab } from "./translationReturn.ts";

test("the approvals link a product at its translations, marked as coming from them", () => {
  const href = productApprovalHref("2f0c7e1a-1111-4222-8333-444455556666");
  assert.equal(href, "/admin/products/2f0c7e1a-1111-4222-8333-444455556666?from=approvals#translations");
  assert.equal(cameFromApprovals(new URL(href, "http://x").search), true);
});

test("a sheet opened any other way does not go back to the approvals", () => {
  assert.equal(cameFromApprovals(""), false);
  assert.equal(cameFromApprovals("?from=list"), false);
  assert.equal(cameFromApprovals("?page=2"), false);
});

test("back to the approvals tab, saying what was saved", () => {
  assert.equal(approvalsHref(), "/admin/translations?sekme=onaylar");
  const saved = new URL(approvalsHref("Elmas Kesim Nargile & Lüle"), "http://x");
  assert.equal(saved.searchParams.get("sekme"), "onaylar");
  assert.equal(saved.searchParams.get("kaydedildi"), "Elmas Kesim Nargile & Lüle");
});

test("the tab an address asks for; the approvals unless it names the texts", () => {
  assert.equal(requestedTab(""), "approvals");
  assert.equal(requestedTab("?sekme=onaylar"), "approvals");
  assert.equal(requestedTab("?tab=approvals"), "approvals");
  assert.equal(requestedTab("?sekme=ceviriler"), "texts");
  assert.equal(requestedTab("?tab=texts"), "texts");
  assert.equal(requestedTab("?sekme=onaylar&kaydedildi=X"), "approvals");
});
