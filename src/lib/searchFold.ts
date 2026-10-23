/**
 * Text as a search compares it: Turkish letters folded to plain ASCII and
 * lowercased, so "lule" finds "Lüle", "komur" "KÖMÜR", "nargile" "NARGİLE".
 * The same folding the API's search does (`_fold_tr` in api/v1/products.py),
 * so a list filtered here and a list searched there agree.
 */
const FOLD: Record<string, string> = {
  İ: "i", I: "i", ı: "i",
  Ö: "o", ö: "o",
  Ü: "u", ü: "u",
  Ş: "s", ş: "s",
  Ç: "c", ç: "c",
  Ğ: "g", ğ: "g",
  Â: "a", â: "a",
  Î: "i", î: "i",
  Û: "u", û: "u",
};

export function foldSearch(text: string | null | undefined): string {
  return (text ?? "").replace(/[İIıÖöÜüŞşÇçĞğÂâÎîÛû]/g, (ch) => FOLD[ch]).toLowerCase();
}

/** Whether `needle` (as typed) occurs in any of `texts`, folded; an empty needle matches everything. */
export function matchesSearch(needle: string, ...texts: (string | null | undefined)[]): boolean {
  const q = foldSearch(needle.trim());
  return !q || texts.some((t) => foldSearch(t).includes(q));
}
