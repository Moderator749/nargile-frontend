/**
 * Turkish tax and identity numbers, checked the same way the server checks them
 * (`app/core/tr_identity.py`): a VKN is 10 digits, a TCKN is 11 and carries a
 * checksum. Catching a mistyped number here saves a round trip; the server
 * still has the last word.
 */

export const digitsOnly = (value: string) => value.replace(/\D/g, "");

/** The official checksum: the 10th digit follows from the first nine, the 11th from the first ten. */
export function isValidTckn(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const d = [...value].map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  if ((odd * 7 - even) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10 === d[10];
}

export const isValidVkn = (value: string) => /^\d{10}$/.test(value);

/** A sole proprietor is registered under either, so both count. */
export const isValidTaxId = (value: string) => isValidVkn(value) || isValidTckn(value);

/** Enough digits to be a Turkish phone number, however the customer spaced it out. */
export const isValidPhone = (value: string) => digitsOnly(value).length >= 10;

/**
 * A number from any country: a dialling code, whatever punctuation groups the
 * digits, and as few as seven of them — some countries really are that short.
 */
export const isValidInternationalPhone = (value: string) =>
  /^\+?[0-9 ()./-]{7,30}$/.test(value.trim()) && digitsOnly(value).length >= 7;
