/*
 * "WhatsApp ile Kurtar" on a failed card payment: the shop offers the virtual
 * POS commission back as a transfer discount. The server makes the order a
 * transfer at 5% off (POST /admin/orders/{id}/recover-to-transfer); these are
 * the figures the button shows before that, and the message sent after it.
 */

/** The transfer discount offered, in percent — the server's rate, until an order says its own. */
export const RECOVERY_DISCOUNT_PERCENT = 5;

/**
 * The total before and after the discount, worked in kuruş so it rounds once,
 * half up, to the kuruş — as the server does: 1.551,52 TL → 1.473,94 TL.
 */
export function recoveryAmounts(
  total: number,
  percent: number = RECOVERY_DISCOUNT_PERCENT,
): { before: number; after: number; discount: number } {
  const kurus = Math.round(total * 100);
  const off = Math.round((kurus * percent) / 100);
  return { before: kurus / 100, after: (kurus - off) / 100, discount: off / 100 };
}

/** After this hour (İstanbul), a parcel no longer leaves the same day. */
export const SHIPPING_CUTOFF_HOUR = 16;

const ISTANBUL_DAY_HOUR = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Istanbul",
  weekday: "short",
  hour: "numeric",
  hourCycle: "h23",
});

/**
 * Whether an order paid now still ships today: a weekday (Monday–Friday)
 * before 16:00 on İstanbul's clock. An evening or a weekend says "ilk
 * sevkiyatta" instead, which is never untrue.
 */
export function shipsToday(now: Date = new Date()): boolean {
  const parts = ISTANBUL_DAY_HOUR.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  return weekday !== "Sat" && weekday !== "Sun" && hour < SHIPPING_CUTOFF_HOUR;
}

/** A percent as Turkish writes it: 5 → "5", 2.5 → "2,5". */
function percentText(value: number): string {
  return String(Math.round(value * 100) / 100).replace(".", ",");
}

export interface RecoveryOffer {
  /** The customer's full name; the message greets them by the first. */
  name: string | null | undefined;
  /** The totals, already formatted ("1.551,52 TL"). */
  before: string;
  after: string;
  discountPercent: number;
  /** A guest checkout ("Üye olmadan devam et"), not a registered account. */
  guest: boolean;
  /** The Sultan Puan rate of the buyer's price list (a guest's as a member); null: none to offer. */
  loyaltyPercent: number | null;
  /** Whether this order earns it (its total inside the band): only then is it promised to a member. */
  earnsPoints: boolean;
  /** The moment the message is written, for the shipping sentence. */
  now?: Date;
}

/**
 * The message. A member is promised the Sultan Puan this order earns; a guest
 * is told what signing up brings; neither is promised points the shop's rules
 * would not give (B2B, Sultan Puan off, a total outside the band) — the
 * sentence then ends with the discount. No name: "Merhaba,".
 */
export function recoveryMessage(offer: RecoveryOffer): string {
  const first = offer.name?.trim().split(/\s+/)[0];
  const discount = `İşlemi havale ile tamamlamak isterseniz *%${percentText(offer.discountPercent)} havale indirimiyle* tutarınız *${offer.before} yerine ${offer.after}*'ye düşüyor`;
  const rate = offer.loyaltyPercent ? `*%${percentText(offer.loyaltyPercent)} SultanPuan*` : null;
  const advantage = !rate
    ? `${discount}.`
    : offer.guest
      ? `${discount}; dilerseniz üyelik oluşturduğunuzda ${rate} avantajından da yararlanabilirsiniz.`
      : offer.earnsPoints
        ? `${discount}; ayrıca ${rate} hesabınıza tanımlanıyor.`
        : `${discount}.`;
  const shipping = shipsToday(offer.now)
    ? "Uygunsa IBAN bilgilerimizi ileteyim, siparişinizi bugün kargoya verelim."
    : "Uygunsa IBAN bilgilerimizi ileteyim, siparişinizi ilk sevkiyatta kargoya verelim.";
  return [
    `Merhaba${first ? ` ${first}` : ""}, *Nargile Malzemesi*'nden ulaşıyorum. 👋`,
    "Siparişinizde banka onayından kaynaklı ufak bir takılma olmuş, ürünlerinizi sizin için ayırdık.",
    advantage,
    `${shipping} 📦`,
  ].join("\n\n");
}
