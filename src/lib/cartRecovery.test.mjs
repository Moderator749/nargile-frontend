// `npm test` — Node's own runner; it reads the TypeScript module as is.
import assert from "node:assert/strict";
import { test } from "node:test";

import { recoveryAmounts, recoveryMessage, shipsToday, whatsappSendHref } from "./cartRecovery.ts";
import { formatMoney } from "./format.ts";

test("five percent off, to the kuruş", () => {
  assert.deepEqual(recoveryAmounts(1551.52), { before: 1551.52, after: 1473.94, discount: 77.58 });
  assert.deepEqual(recoveryAmounts(1000), { before: 1000, after: 950, discount: 50 });
  // 0,30 TL × 5% = 1,5 kuruş: half up.
  assert.deepEqual(recoveryAmounts(0.3), { before: 0.3, after: 0.28, discount: 0.02 });
  // A float that is not quite its decimal (0.1 + 0.2) still lands on the kuruş.
  assert.equal(recoveryAmounts(0.1 + 0.2).after, 0.28);
});

test("another rate, when the order says one", () => {
  assert.deepEqual(recoveryAmounts(1000, 7), { before: 1000, after: 930, discount: 70 });
  assert.deepEqual(recoveryAmounts(30000, 7), { before: 30000, after: 27900, discount: 2100 });
});

test("the amounts read as the shop writes them", () => {
  const { before, after } = recoveryAmounts(1551.52);
  assert.equal(formatMoney(before), "1.551,52 TL");
  assert.equal(formatMoney(after), "1.473,94 TL");
});

// İstanbul is UTC+3 all year. 2026-11-27 is a Friday, 28 a Saturday, 29 a Sunday.
const FRI_1559 = new Date("2026-11-27T12:59:00Z");
const FRI_1600 = new Date("2026-11-27T13:00:00Z");
const FRI_2330 = new Date("2026-11-27T20:30:00Z");
const SAT_1000 = new Date("2026-11-28T07:00:00Z");
const SAT_1130 = new Date("2026-11-28T08:30:00Z");
const SAT_1159 = new Date("2026-11-28T08:59:00Z");
const SAT_1200 = new Date("2026-11-28T09:00:00Z");
const SAT_1230 = new Date("2026-11-28T09:30:00Z");
const SUN_1000 = new Date("2026-11-29T07:00:00Z");
const MON_0005 = new Date("2026-11-29T21:05:00Z"); // 00:05 on Monday in İstanbul, still Sunday in UTC

test("ships today: Mon–Fri before 16:00, Saturday before 12:00, never Sunday (İstanbul)", () => {
  assert.equal(shipsToday(FRI_1559), true);
  assert.equal(shipsToday(FRI_1600), false);
  assert.equal(shipsToday(FRI_2330), false);
  assert.equal(shipsToday(SAT_1000), true);
  assert.equal(shipsToday(SAT_1130), true);
  assert.equal(shipsToday(SAT_1159), true);
  assert.equal(shipsToday(SAT_1200), false);
  assert.equal(shipsToday(SAT_1230), false);
  assert.equal(shipsToday(SUN_1000), false);
  assert.equal(shipsToday(MON_0005), true);
});

const before = formatMoney(1551.52);
const after = formatMoney(1473.94);
// As the live store has it: havale 5% (below ₺30.000), Sultan Puan 10%.
const offer = {
  name: "Ahmet Yılmaz",
  before,
  after,
  discountPercent: 5,
  guest: false,
  loyaltyPercent: 10,
  earnsPoints: true,
};

const MEMBER_BLOCK = `İşlemi havale ile tamamlamak isterseniz *%5 havale indirimiyle* tutarınız *${before} yerine ${after}*'ye düşüyor; ayrıca *%10 SultanPuan* hesabınıza tanımlanıyor.`;
const GUEST_BLOCK = `İşlemi havale ile tamamlamak isterseniz *%5 havale indirimiyle* tutarınız *${before} yerine ${after}*'ye düşüyor; dilerseniz üyelik oluşturduğunuzda *%10 SultanPuan* avantajından da yararlanabilirsiniz.`;
const TODAY = "Uygunsa IBAN bilgilerimizi ileteyim, siparişinizi bugün kargoya verelim. 📦";
const FIRST = "Uygunsa IBAN bilgilerimizi ileteyim, siparişinizi ilk sevkiyatta kargoya verelim. 📦";
const head = (name) =>
  `Merhaba ${name}, *Nargile Malzemesi*'nden ulaşıyorum. 👋\n\nSiparişinizde banka onayından kaynaklı ufak bir takılma olmuş, ürünlerinizi sizin için ayırdık.`;

test("1) a registered member before 16:00", () => {
  assert.equal(recoveryMessage({ ...offer, now: FRI_1559 }), `${head("Ahmet")}\n\n${MEMBER_BLOCK}\n\n${TODAY}`);
});

test("2) a registered member at and after 16:00", () => {
  assert.equal(recoveryMessage({ ...offer, now: FRI_1600 }), `${head("Ahmet")}\n\n${MEMBER_BLOCK}\n\n${FIRST}`);
  assert.equal(recoveryMessage({ ...offer, now: FRI_2330 }), `${head("Ahmet")}\n\n${MEMBER_BLOCK}\n\n${FIRST}`);
});

test("3) a guest before and after 16:00", () => {
  const guest = { ...offer, name: "Ayşe Nur Kaya", guest: true, earnsPoints: false };
  assert.equal(recoveryMessage({ ...guest, now: FRI_1559 }), `${head("Ayşe")}\n\n${GUEST_BLOCK}\n\n${TODAY}`);
  assert.equal(recoveryMessage({ ...guest, now: FRI_1600 }), `${head("Ayşe")}\n\n${GUEST_BLOCK}\n\n${FIRST}`);
});

test("4) the shown havale rate and the new total agree: 5% below ₺30.000", () => {
  const { before: b, after: a } = recoveryAmounts(5999, 5);
  const text = recoveryMessage({ ...offer, before: formatMoney(b), after: formatMoney(a), discountPercent: 5, now: FRI_1559 });
  assert.ok(text.includes("*%5 havale indirimiyle* tutarınız *5.999,00 TL yerine 5.699,05 TL*'ye düşüyor"));
});

test("4) the shown havale rate and the new total agree: 7% from ₺30.000", () => {
  const { before: b, after: a } = recoveryAmounts(30000, 7);
  const text = recoveryMessage({ ...offer, before: formatMoney(b), after: formatMoney(a), discountPercent: 7, now: FRI_1559 });
  assert.ok(text.includes("*%7 havale indirimiyle* tutarınız *30.000,00 TL yerine 27.900,00 TL*'ye düşüyor"));
});

test("the havale rate and the Sultan Puan rate are never swapped", () => {
  const text = recoveryMessage({ ...offer, discountPercent: 5, loyaltyPercent: 10, now: FRI_1559 });
  assert.ok(text.includes("*%5 havale indirimiyle*"));
  assert.ok(text.includes("*%10 SultanPuan*"));
  assert.ok(!text.includes("*%10 havale"));
  assert.ok(!text.includes("*%5 SultanPuan*"));
});

test("Saturday: 11:30 ships today, 12:30 on the first shipment; Sunday never today", () => {
  assert.ok(recoveryMessage({ ...offer, now: SAT_1130 }).endsWith(TODAY));
  assert.ok(recoveryMessage({ ...offer, now: SAT_1230 }).endsWith(FIRST));
  assert.ok(recoveryMessage({ ...offer, now: SUN_1000 }).endsWith(FIRST));
});

test("a fractional rate reads the Turkish way", () => {
  assert.ok(recoveryMessage({ ...offer, discountPercent: 2.5, now: FRI_1559 }).includes("*%2,5 havale indirimiyle*"));
});

test("no points promised that the rules would not give", () => {
  const plain = `İşlemi havale ile tamamlamak isterseniz *%5 havale indirimiyle* tutarınız *${before} yerine ${after}*'ye düşüyor.`;
  // A member whose total is outside the Sultan Puan band.
  assert.ok(recoveryMessage({ ...offer, earnsPoints: false, now: FRI_1559 }).includes(`\n\n${plain}\n\n`));
  // A B2B buyer, or Sultan Puan off: no rate at all, member or guest.
  assert.ok(recoveryMessage({ ...offer, loyaltyPercent: null, now: FRI_1559 }).includes(`\n\n${plain}\n\n`));
  assert.ok(recoveryMessage({ ...offer, guest: true, loyaltyPercent: null, now: FRI_1559 }).includes(`\n\n${plain}\n\n`));
});

test("no name: a plain greeting", () => {
  assert.ok(recoveryMessage({ ...offer, name: "  " }).startsWith("Merhaba, *Nargile Malzemesi*"));
  assert.ok(recoveryMessage({ ...offer, name: null }).startsWith("Merhaba, *Nargile Malzemesi*"));
});

test("the link: api.whatsapp.com/send, emoji intact as UTF-8", () => {
  const text = recoveryMessage({ ...offer, now: FRI_1559 });
  assert.ok(text.includes("👋") && text.includes("📦"));
  assert.ok(!text.includes("\uFFFD"));
  const href = whatsappSendHref("905321112233", text);
  assert.ok(href.startsWith("https://api.whatsapp.com/send?phone=905321112233&text="));
  assert.ok(!href.includes("wa.me"));
  // Nothing raw in the query: no spaces, line breaks or emoji.
  assert.ok(!/[\s👋📦]/u.test(href));
  // 👋 U+1F44B and 📦 U+1F4E6, each as its four UTF-8 bytes.
  assert.ok(href.includes("%F0%9F%91%8B"));
  assert.ok(href.endsWith("%20%F0%9F%93%A6"));
  const url = new URL(href);
  assert.equal(url.searchParams.get("phone"), "905321112233");
  assert.equal(url.searchParams.get("text"), text);
  assert.ok(
    href.startsWith(
      "https://api.whatsapp.com/send?phone=905321112233&text=Merhaba%20Ahmet%2C%20*Nargile%20Malzemesi*'nden%20ula%C5%9F%C4%B1yorum.%20%F0%9F%91%8B%0A%0A",
    ),
  );
});
