/**
 * A phone number as `wa.me` wants it: digits only, with a country code and no
 * leading plus.
 *
 * Numbers reach us as people type them — "0532 111 22 33" from a Turkish
 * customer, "+49 30 1234 5678" from a German one — so the country code has to
 * be worked out before a link can be built. When it cannot be worked out with
 * confidence the answer is null: no button is better than one that opens a
 * conversation with a stranger.
 */
export function whatsappNumber(raw: string | null | undefined): string | null {
  const given = (raw ?? "").trim();
  const digits = given.replace(/\D/g, "");
  // Written with its own country code, one way or the other.
  if (given.startsWith("+") || digits.startsWith("00")) {
    const international = digits.startsWith("00") ? digits.slice(2) : digits;
    return international.length >= 8 ? international : null;
  }
  // Turkish, as Turkey writes them: 0 5xx xxx xx xx, or the same without the 0.
  if (digits.length === 11 && digits.startsWith("05")) return `90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `90${digits}`;
  if (digits.length === 12 && digits.startsWith("905")) return digits;
  return null;
}

/** The chat link for a number, or null when there is nothing dialable. */
export function whatsappHref(raw: string | null | undefined, message?: string): string | null {
  const number = whatsappNumber(raw);
  if (!number) return null;
  return message ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : `https://wa.me/${number}`;
}
