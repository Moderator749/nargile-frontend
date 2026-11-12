// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { blockBreaks, cleanCode, leadText, productDescription, productTitle, productType, tidyBrand, tidyName, DESCRIPTION_MAX, TITLE_MAX } from "./productSeo.ts";

test("a shouted name in title case, units and abbreviations kept sensible", () => {
  assert.equal(tidyName("COSMIC TURKISH MASTIC 200 GR"), "Cosmic Turkish Mastic 200 gr");
  assert.equal(tidyName("FALCON MILANO 250 GR"), "Falcon Milano 250 gr");
  assert.equal(tidyName("NFX DERİ MARPUÇ XL"), "NFX Deri Marpuç XL");
  assert.equal(tidyName("Alpha Hookah Echo Nargile Takımı"), "Alpha Hookah Echo Nargile Takımı");
  assert.equal(tidyBrand("alpha hookah"), "Alpha Hookah");
  assert.equal(tidyBrand("Mr.Wood"), "Mr.Wood");
  assert.equal(tidyBrand("PANADA HOOKAH"), "Panada Hookah");
  assert.equal(tidyBrand("ADYA COCO'S"), "Adya Coco's");
  assert.equal(tidyBrand("QUASAR ARGUILE"), "Quasar Arguile");
});

test("only a clean model code is kept, and not when the name already has it", () => {
  for (const code of ["LL105", "RTK 60-03", "KM01", "LH031-V1", "CSM 05", "DNT11", "FLC 03", "RTK 29-1"]) {
    assert.equal(cleanCode(code, "Bir Ürün"), code, code);
  }
  assert.equal(cleanCode("NAİMİ MR03", "Naimi Woodking"), null);
  assert.equal(cleanCode("NA53-1 KLASIK", "Copper Balance - Klasik"), null);
  assert.equal(cleanCode("LH013", "LH013 Legend Hookah Çantalı"), null);
});

test("the type is added only where the name does not say it", () => {
  assert.equal(productType("kozlukler", "Copper Balance - Klasik"), "Közlük (HMD)");
  assert.equal(productType("bitkisel-urunler", "FALCON MILANO 250 GR"), "Bitkisel Nargile Aroması");
  assert.equal(productType("luleler", "Toprak Lüle - Büyük Erkek"), null);
  assert.equal(productType("malzemeler", "Köz Maşası"), null);
});

test("titles fit in 60, dropping the code, then the brand, then the type", () => {
  const cases = [
    { name: "Toprak Lüle - Büyük Erkek", code: "LL105", brand: null, type: null },
    { name: "Copper Balance - Klasik", code: null, brand: "Copper Balance", type: "Közlük (HMD)" },
    { name: "FALCON MILANO 250 GR", code: "FLC 03", brand: null, type: "Bitkisel Nargile Aroması" },
    { name: "Masaüstü Nargile Takımı", code: "LH031-V1", brand: "Legend Hookah", type: null },
    { name: "Steamulation Ultimate Black Gloss Gen 3 Nargile Takımı Graphite Metallic", code: "STEAM 16-1", brand: "Steamulation", type: null },
  ];
  const titles = cases.map(productTitle);
  for (const t of titles) assert.ok(t.length <= TITLE_MAX || !t.includes(" — "), t);
  assert.equal(titles[0], "Toprak Lüle - Büyük Erkek (LL105)");
  assert.equal(titles[1], "Copper Balance - Klasik Közlük (HMD)");
  assert.equal(titles[2], "Falcon Milano 250 gr Bitkisel Nargile Aroması (FLC 03)");
  assert.equal(titles[3], "Masaüstü Nargile Takımı (LH031-V1) — Legend Hookah");
  // A brand in capitals the name already says (dotless ı or not) is not repeated.
  assert.equal(productTitle({ name: "Samsaris Yedek Cam Lüle", code: "LL126", brand: "SAMSARIS", type: null }), "Samsaris Yedek Cam Lüle (LL126)");
  assert.equal(productTitle({ name: "Bobby Robot Nargile Takımı", code: null, brand: "PANADA HOOKAH", type: null }), "Bobby Robot Nargile Takımı — Panada Hookah");
  // Too long for anything more: the name alone.
  assert.equal(titles[4], "Steamulation Ultimate Black Gloss Gen 3 Nargile Takımı Graphite Metallic");
});

test("descriptions lead with the product, end with the promise, fit in 158", () => {
  const set = productDescription({
    lead: "Alpha Hookah Echo, paslanmaz çelik kalitesini ve renkli eloksal alüminyum şıklığını, sadelik ve zarafet ile birleştiren üst segment bir nargile takımıdır. Detaylar sayfada.",
    name: "Alpha Hookah Echo Nargile Takımı", brand: "alpha hookah", type: null, shipping: "free", threshold: "3.000 TL",
  });
  assert.ok(set.length <= DESCRIPTION_MAX, `${set.length}: ${set}`);
  assert.ok(set.endsWith("Orijinal Alpha Hookah ürün güvencesi, ücretsiz kargo."), set);

  const coal = productDescription({ lead: "", name: "SultanCoco Nargile Kömürü", brand: "Sultan Nargile", type: null, shipping: "none", threshold: "3.000 TL" });
  assert.equal(coal, "SultanCoco Nargile Kömürü. Orijinal Sultan Nargile ürün güvencesi, hızlı kargo.");

  const bowl = productDescription({ lead: "Ürün Kodu: LL105", name: "Toprak Lüle - Büyük Erkek", brand: null, type: null, shipping: "threshold", threshold: "3.000 TL" });
  assert.equal(bowl, "Toprak Lüle - Büyük Erkek. Orijinal ürün güvencesi, 3.000 TL üzeri ücretsiz kargo.");

  const quoted = productDescription({ lead: leadText("''NAİMİ WOODKING'' marpucu keçi derisinden, usta ellerde şekillendirilmiş.", "Naimi Woodking", "Naimi"), name: "Naimi Woodking", brand: "Naimi", type: null, shipping: "threshold", threshold: "3.000 TL" });
  assert.ok(!quoted.includes("'"), quoted);
});

// htmlToText's job, for the test: the tags gone, entities left alone.
const plain = (html) => blockBreaks(html).replace(/<[^>]+>/g, " ");

test("the lead: headings end sentences, shouting is calmed the Turkish way, names keep their casing", () => {
  assert.equal(
    leadText(plain("<p>MASTİK SAKIZ AROMALI ÇAY YAPRAKLARINDAN ÜRETİLMİŞTİR.</p>"), "COSMIC TURKISH MASTIC 200 GR", null),
    "Mastik sakız aromalı çay yapraklarından üretilmiştir.",
  );
  assert.equal(
    leadText(plain("<h2>Copper Balance Klasik</h2><p>Bu közlük (HMD), alüminyum ya da çelik yerine bakırdan.</p>"), "Copper Balance - Klasik", "COPPER BALANCE"),
    "Copper Balance Klasik. Bu közlük (HMD), alüminyum ya da çelik yerine bakırdan.",
  );
  assert.equal(
    leadText(plain("<p>NARGİLE TAKIMINIZIN EN ASİL PARÇASI NAİMİ WOODKING NARGİLE MARPUCU</p><p>Kaliteli keçi derisi.</p>"), "Naimi Woodking Ahşap Nargile Marpucu", "Naimi"),
    "Nargile takımınızın en asil parçası Naimi Woodking nargile marpucu. Kaliteli keçi derisi.",
  );
  // A lone abbreviation or a short run in mixed text is left as written.
  assert.equal(leadText(plain("<p>LED ışıklı, HMD uyumlu.</p>"), "Bir Takım", null), "LED ışıklı, HMD uyumlu.");
  assert.equal(leadText(plain("<p>''NAİMİ'' marpuç. Ürün Kodu: MR03</p>"), "Naimi", "Naimi"), "NAİMİ marpuç.");
});

test("a heading that repeats the name is dropped; a long first sentence is cut at a word", () => {
  const lead = leadText(plain("<h2>Copper Balance Klasik</h2><p>Bu közlük (HMD), nargile sektöründe alüminyum ya da çelik yerine saf bakırdan üretilmiştir ve ısıyı kömürün her yanına eşit dağıtır, böylece yanık tat olmadan uzun bir içim sunar.</p>"), "Copper Balance - Klasik", "COPPER BALANCE");
  const d = productDescription({ lead, name: "Copper Balance - Klasik", brand: "COPPER BALANCE", type: "Közlük (HMD)", shipping: "threshold", threshold: "3.000 TL" });
  assert.ok(d.startsWith("Bu közlük (HMD), nargile sektöründe"), d);
  assert.ok(d.length <= DESCRIPTION_MAX && d.includes("… Orijinal Copper Balance ürün güvencesi"), d);
  assert.equal(leadText(plain("<p>BOL DUMANLI ÜRÜNDÜR,</p>"), "X", null), "Bol dumanlı üründür.");
});

test("brand and name headings are both dropped; comma-joined capitals are calmed", () => {
  const lead = leadText(plain("<h3>Panada Hookah</h3><h2>Bobby Robot Nargile Takımı</h2><p>Sıradışı robot tasarımı ve yenilikçi özellikleri.</p>"), "Bobby Robot Nargile Takımı", "PANADA HOOKAH");
  const d = productDescription({ lead, name: "Bobby Robot Nargile Takımı", brand: "PANADA HOOKAH", type: null, shipping: "free", threshold: "3.000 TL" });
  assert.equal(d, "Sıradışı robot tasarımı ve yenilikçi özellikleri. Orijinal Panada Hookah ürün güvencesi, ücretsiz kargo.");
  assert.equal(leadText(plain("<p>ŞEFTALİ, ANANAS, AHUDUDU,BÖĞÜRTLEN,YABAN MERSİNİ,BUZ AROMALI</p>"), "Falcon Milano", null), "Şeftali, ananas, ahududu, böğürtlen, yaban mersini, buz aromalı.");
});

test("a replica is never promised as an original; a heading of name and trade words is dropped", () => {
  const d = productDescription({ lead: "Quasar Raas 2 Nargile Lülesi. Fransa'da geliştirilen bir lüle tasarımının replikasıdır.", name: "Quasar Raas 2 (Replika) Nargile Lülesi", brand: "Quasar", type: null, shipping: "threshold", threshold: "3.000 TL" });
  assert.ok(!/orijinal/i.test(d), d);
  assert.equal(d, "Fransa'da geliştirilen bir lüle tasarımının replikasıdır. Replika model, 3.000 TL üzeri ücretsiz kargo.");
  const caos = productDescription({ lead: "Caos Lüle Seti. Yenilikçi tasarımı ve pratik kullanımı bir araya getirir.", name: "Caos Cam Lüle Seti", brand: "caos", type: null, shipping: "threshold", threshold: "3.000 TL" });
  assert.ok(caos.startsWith("Yenilikçi tasarımı"), caos);
});
