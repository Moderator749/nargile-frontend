/**
 * The Dosyalar search: a pricing file answers a query by its name or by a
 * product code among its rows. Pure (the comparison's folding is passed in),
 * so it is tested on its own.
 */

export interface FileHit {
  /** The name holds the query. */
  byName: boolean;
  /** The codes that hold it: exact matches first, then the closest. */
  codes: string[];
}

/** How a file answers `query`, or null when neither its name nor a code holds it. */
export function fileHit(
  query: string,
  name: string,
  codes: readonly string[],
  fold: (text: string) => string,
): FileHit | null {
  const q = fold(query);
  if (!q) return { byName: true, codes: [] };
  const byName = fold(name).includes(q);
  const keyed = codes.map((code) => ({ code, key: fold(code) })).filter((c) => c.key.includes(q));
  keyed.sort(
    (a, b) =>
      Number(b.key === q) - Number(a.key === q) ||
      a.key.length - b.key.length ||
      a.code.localeCompare(b.code, "tr", { numeric: true }),
  );
  if (!byName && keyed.length === 0) return null;
  return { byName, codes: keyed.map((c) => c.code) };
}

/** The card's line for a file found by its codes: "Eşleşen kod: Steam 09 +2 kod". */
export function codeHitLabel(codes: readonly string[]): string {
  if (codes.length === 0) return "";
  return `Eşleşen kod: ${codes[0]}${codes.length > 1 ? ` +${codes.length - 1} kod` : ""}`;
}
