/*
 * "WhatsApp ile Kurtar" on a failed card payment: the shop offers the virtual
 * POS commission back as a transfer discount. The server makes the order a
 * transfer at 5% off (POST /admin/orders/{id}/recover-to-transfer); these are
 * the figures the button shows before that, and the message sent after it.
 */

/** The transfer discount offered, in percent of what the customer was to pay (the server's rate too). */
export const RECOVERY_DISCOUNT_PERCENT = 5;

/**
 * The total before and after the discount, worked in kuruş so it rounds once,
 * half up, to the kuruş — as the server does: 1.551,52 TL → 1.473,94 TL.
 */
export function recoveryAmounts(total: number): { before: number; after: number; discount: number } {
  const kurus = Math.round(total * 100);
  const off = Math.round((kurus * RECOVERY_DISCOUNT_PERCENT) / 100);
  return { before: kurus / 100, after: (kurus - off) / 100, discount: off / 100 };
}

const ISTANBUL = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  hourCycle: "h23",
});
const ISTANBUL_DATE = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long" });

/** The day (as a count of days) and the hour, on the shop's clock. */
function istanbulDayHour(at: Date): { day: number; hour: number } {
  const part = (type: string) => Number(ISTANBUL.formatToParts(at).find((p) => p.type === type)?.value);
  return { day: Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000, hour: part("hour") };
}

/**
 * When the order was placed, as the message's sentence begins ("… oluşturduğunuz
 * siparişte"), on İstanbul's clock: today by the part of the day — Gece
 * (00–06), Sabah (06–12), Bugün (12–18), Akşam (18–24); yesterday the same
 * with "Dün" ("Dün gece", "Dün öğleden sonra"); before that, its date ("3
 * Kasım tarihinde"), as a part of the day long gone would read oddly.
 */
export function placedWhen(createdAt: string | Date, now: Date = new Date()): string {
  const placed = new Date(createdAt);
  const { day, hour } = istanbulDayHour(placed);
  const ago = istanbulDayHour(now).day - day;
  const part = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
  if (ago <= 0) return ["Gece", "Sabah", "Bugün", "Akşam"][part];
  if (ago === 1) return `Dün ${["gece", "sabah", "öğleden sonra", "akşam"][part]}`;
  return `${ISTANBUL_DATE.format(placed)} tarihinde`;
}

/** The message, with the amounts already formatted ("1.551,52 TL"). No name: "Merhaba,". */
export function recoveryMessage(name: string | null | undefined, when: string, before: string, after: string): string {
  const who = name?.trim();
  return [
    `Merhaba${who ? ` ${who}` : ""}, Nargile Malzemesi'nden ulaşıyorum.`,
    `${when} oluşturduğunuz siparişte banka limit/onay sistemlerinden kaynaklı ufak bir takılma olmuş. Siparişinizi iptal etmedik, stoklar tükenmeden ürünlerinizi sizin için ayırdık. 🤝`,
    `Eğer işlemi Havale/EFT ile tamamlamak isterseniz, aracı kurum (Sanal POS) komisyonunu iptal edip bu tutarı doğrudan size indirim olarak yansıtabiliriz. Böylece sepet tutarınız ${before} yerine *${after}*'ye düşmüş olur.`,
    "Sizin için de uygunsa ödemeyi tamamlayabilmeniz için IBAN bilgilerimizi iletebilirim, siparişinizi bugün kargoya vermiş oluruz. 🚀",
  ].join("\n\n");
}
