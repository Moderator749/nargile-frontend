/**
 * A username as it is typed: what the server accepts
 * (`^[A-Za-z0-9][A-Za-z0-9._-]{1,28}[A-Za-z0-9]$`, app/schemas/registration.py),
 * made out of whatever the customer actually pressed. Pure, so `npm test`
 * reads it.
 *
 * A space becomes an underscore ("ali veli" → "ali_veli"), a Turkish or other
 * accented letter its plain one ("ayşe" → "ayse"), and anything else is left
 * out. What was changed is reported, so the field can say why the text is not
 * quite what they typed.
 */

export const USERNAME_MAX = 30;
export const USERNAME = /^[A-Za-z0-9][A-Za-z0-9._-]{1,28}[A-Za-z0-9]$/;

// The dotless ı has no decomposition to strip a mark from; the rest come apart
// under NFD, but spelling the Turkish ones out keeps them obvious.
const PLAIN: Record<string, string> = {
  ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I", ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U",
};
const ALLOWED = /^[A-Za-z0-9._-]$/;

export interface CleanedUsername {
  value: string;
  /** A space was turned into an underscore (or dropped at the start). */
  spaces: boolean;
  /** A letter was changed or a character left out. */
  other: boolean;
}

export function cleanUsername(raw: string): CleanedUsername {
  let value = "";
  let spaces = false;
  let other = false;
  for (const ch of raw) {
    if (/\s/.test(ch)) {
      spaces = true;
      // Nothing to join at the start, and one underscore for a run of spaces.
      if (value && !value.endsWith("_")) value += "_";
      continue;
    }
    const plain = PLAIN[ch] ?? ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (plain !== ch) other = true;
    for (const c of plain) {
      if (ALLOWED.test(c)) value += c;
      else other = true;
    }
  }
  return { value: value.slice(0, USERNAME_MAX), spaces, other };
}

/** On leaving the field: a username starts and ends with a letter or digit. */
export const trimUsername = (value: string) => value.replace(/^[._-]+|[._-]+$/g, "");
