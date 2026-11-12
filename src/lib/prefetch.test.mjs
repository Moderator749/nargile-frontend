import assert from "node:assert/strict";
import { test } from "node:test";

import { prefetchByDefault } from "./prefetch.ts";

test("utility pages go on demand; the shop is fetched ahead", () => {
  for (const path of ["/login", "/login?next=/cart", "/kargo-takip", "/account", "/orders/123", "/sozlesmeler/cerez-politikasi", "/bilgi/ayricaliklar-ve-avantajlar", "/sss"]) {
    assert.equal(prefetchByDefault(path), false, path);
  }
  for (const path of ["/", "/cart", "/catalog", "/luleler", "/marka/legend", "/rtk-60-03-alpha-hookah-echo-nargile-takimi", "/firsat-urunleri", "/loginx", "/bilgisayar"]) {
    assert.equal(prefetchByDefault(path), true, path);
  }
});
